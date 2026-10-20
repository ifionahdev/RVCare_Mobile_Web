
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import pool from "../config/db.js";
import { sendResetOtp } from "../services/emailService.js";

const GENERIC_MESSAGE =
  "If the email is registered, a verification code will be sent.";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_DURATION_MINUTES = 10;
const RESEND_SECONDS = 60;
const MAX_ATTEMPTS = 5;
const VERIFICATION_TOKEN_MINUTES = 10;

function otpHash(accountId, platform, otp) {
  return crypto
    .createHmac("sha256", process.env.OTP_SECRET)
    .update(`${accountId}:${platform}:${otp}`)
    .digest("hex");
}

function createVerificationToken(resetId, accountId, platform, expiresAt) {
  const payload = Buffer.from(
    JSON.stringify({
      resetId,
      accountId,
      platform,
      expiresAt: new Date(expiresAt).getTime(),
    })
  ).toString("base64url");
  const signature = crypto
    .createHmac("sha256", process.env.OTP_SECRET)
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

function readVerificationToken(token) {
  if (typeof token !== "string") return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.OTP_SECRET)
    .update(payload)
    .digest("base64url");
  const expected = Buffer.from(expectedSignature);
  const provided = Buffer.from(signature);

  if (
    expected.length !== provided.length ||
    !crypto.timingSafeEqual(expected, provided)
  ) {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());

    if (
      !Number.isInteger(data.resetId) ||
      !Number.isInteger(data.accountId) ||
      !validPlatform(data.platform) ||
      !Number.isFinite(data.expiresAt) ||
      data.expiresAt <= Date.now()
    ) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

function validPlatform(platform) {
  return platform === "web" || platform === "mobile";
}

function activeProfileCondition() {
  return `
    (
      (r.role_slug = 'admin'
        AND ad.admin_id IS NOT NULL
        AND ad.is_deleted = 0)
      OR
      (r.role_slug = 'vet'
        AND v.vet_id IS NOT NULL
        AND v.is_deleted = 0)
      OR
      (r.role_slug = 'customer'
        AND po.owner_id IS NOT NULL
        AND po.is_deleted = 0)
    )
  `;
}

async function findActiveAccount(email, platform) {
  const [rows] = await pool.execute(
    `SELECT a.account_id
     FROM tbl_account a
     INNER JOIN tbl_role r ON r.role_id = a.role_id
     LEFT JOIN tbl_admin ad ON ad.account_id = a.account_id
     LEFT JOIN tbl_veterinarian v ON v.account_id = a.account_id
     LEFT JOIN tbl_pet_owner po ON po.account_id = a.account_id
     WHERE a.username = ?
       AND (
         (? = 'web' AND r.role_slug IN ('admin', 'vet'))
         OR
         (? = 'mobile' AND r.role_slug = 'customer')
       )
       AND ${activeProfileCondition()}
     LIMIT 1`,
    [email, platform, platform]
  );

  return rows[0] ?? null;
}

export async function forgotPassword(req, res) {
  const requestId = req.requestId ?? "unknown";
  const email = String(req.body?.email ?? "")
    .trim()
    .toLowerCase();

  const platform = req.body?.platform;

  if (!validPlatform(platform) || !emailPattern.test(email)) {
    console.warn(
      `[password-reset] ${requestId} Rejected invalid forgot-password request.`
    );
    return res.status(400).json({
      message: "Enter a valid email and platform.",
    });
  }

  try {
    console.log(
      `[password-reset] ${requestId} Looking up an active ${platform} account.`
    );
    const account = await findActiveAccount(email, platform);

    if (!account) {
      console.log(
        `[password-reset] ${requestId} No active account matched the request.`
      );
      return res.json({ message: GENERIC_MESSAGE });
    }

    const accountId = account.account_id;
    console.log(
      `[password-reset] ${requestId} Active account ${accountId} matched for platform ${platform}.`
    );

    const [recent] = await pool.execute(
      `SELECT reset_id,
              GREATEST(
                0,
                60 - TIMESTAMPDIFF(
                  SECOND,
                  created_at,
                  NOW()
                )
              ) AS seconds_remaining
       FROM tbl_password_reset
       WHERE account_id = ?
         AND platform = ?
         AND created_at > DATE_SUB(
           NOW(), INTERVAL 60 SECOND
         )
       ORDER BY reset_id DESC
       LIMIT 1`,
      [accountId, platform]
    );

    if (recent.length > 0) {
      console.log(
        `[password-reset] ${requestId} Request blocked by the 60-second resend limit; ` +
          `${recent[0].seconds_remaining} seconds remaining.`
      );
      return res.json({ message: GENERIC_MESSAGE });
    }

    const otp = crypto.randomInt(0, 1000000)
      .toString()
      .padStart(6, "0");

    const hash = otpHash(accountId, platform, otp);

    // Keep the previous code valid until a new email is sent.
    const [result] = await pool.execute(
      `INSERT INTO tbl_password_reset
         (account_id, platform, token_hash, expires_at)
       VALUES (
         ?, ?, ?,
         DATE_ADD(NOW(), INTERVAL 10 MINUTE)
       )`,
      [accountId, platform, hash]
    );

    console.log(
      `[password-reset] ${requestId} Code created for account ${accountId} (${platform}); attempting email delivery.`
    );

    try {
      await sendResetOtp(email, otp);

      await pool.execute(
        `UPDATE tbl_password_reset
         SET used_at = NOW()
         WHERE account_id = ?
           AND platform = ?
           AND reset_id <> ?
           AND used_at IS NULL`,
        [accountId, platform, result.insertId]
      );

      console.log(
        `[password-reset] ${requestId} Code sent successfully for account ${accountId} (${platform}).`
      );
    } catch (error) {
      await pool.execute(
        `UPDATE tbl_password_reset
         SET used_at = NOW()
         WHERE reset_id = ?`,
        [result.insertId]
      );

      console.error(
        `[password-reset] ${requestId} Code was not sent for account ${accountId} (${platform}):`,
        error.message
      );
    }

    return res.json({ message: GENERIC_MESSAGE });
  } catch (error) {
    console.error(`[password-reset] ${requestId} Forgot password failed:`, error);

    return res.status(500).json({
      message: "Unable to process the request right now.",
    });
  }
}

export async function verifyResetCode(req, res) {
  const requestId = req.requestId ?? "unknown";
  const email = String(req.body?.email ?? "")
    .trim()
    .toLowerCase();
  const platform = req.body?.platform;
  const otp = String(req.body?.otp ?? "");

  if (
    !validPlatform(platform) ||
    !emailPattern.test(email) ||
    !/^\d{6}$/.test(otp)
  ) {
    return res.status(400).json({
      message: "Invalid verification information.",
    });
  }

  let connection;

  try {
    const account = await findActiveAccount(email, platform);

    if (!account) {
      return res.status(400).json({
        message: "Invalid or expired verification code.",
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [records] = await connection.execute(
      `SELECT reset_id, token_hash, attempt_count, expires_at
       FROM tbl_password_reset
       WHERE account_id = ?
         AND platform = ?
         AND used_at IS NULL
         AND expires_at > NOW()
       ORDER BY reset_id DESC
       LIMIT 1
       FOR UPDATE`,
      [account.account_id, platform]
    );

    const record = records[0];

    if (!record || record.attempt_count >= MAX_ATTEMPTS) {
      await connection.rollback();
      return res.status(400).json({
        message: "Invalid or expired verification code.",
      });
    }

    const expected = Buffer.from(record.token_hash, "hex");
    const provided = Buffer.from(
      otpHash(account.account_id, platform, otp),
      "hex"
    );
    const matches =
      expected.length === provided.length &&
      crypto.timingSafeEqual(expected, provided);

    if (!matches) {
      await connection.execute(
        `UPDATE tbl_password_reset
         SET attempt_count = attempt_count + 1,
             used_at = CASE
               WHEN attempt_count + 1 >= ?
               THEN NOW()
               ELSE used_at
             END
         WHERE reset_id = ?`,
        [MAX_ATTEMPTS, record.reset_id]
      );
      await connection.commit();

      console.warn(
        `[password-reset] ${requestId} Verification code rejected for account ${account.account_id} (${platform}).`
      );
      return res.status(400).json({
        message: "Invalid or expired verification code.",
      });
    }

    await connection.commit();

    console.log(
      `[password-reset] ${requestId} Verification code accepted for account ${account.account_id} (${platform}).`
    );

    return res.json({
      verificationToken: createVerificationToken(
        record.reset_id,
        account.account_id,
        platform,
        Math.min(
          new Date(record.expires_at).getTime(),
          Date.now() + VERIFICATION_TOKEN_MINUTES * 60 * 1000
        )
      ),
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error(`[password-reset] ${requestId} Code verification failed:`, error);
    return res.status(500).json({
      message: "Unable to verify the code right now.",
    });
  } finally {
    if (connection) connection.release();
  }
}

export async function resetPassword(req, res) {
  const email = String(req.body?.email ?? "")
    .trim()
    .toLowerCase();

  const platform = req.body?.platform;
  const verificationToken = req.body?.verificationToken;
  const password = req.body?.password;

  if (
    !validPlatform(platform) ||
    !emailPattern.test(email) ||
    !readVerificationToken(verificationToken)
  ) {
    return res.status(400).json({
      message: "Invalid verification information.",
    });
  }

  if (
    typeof password !== "string" ||
    password.length < 12 ||
    password.length > 128
  ) {
    return res.status(400).json({
      message: "Password must contain 12 to 128 characters.",
    });
  }

  let connection;

  try {
    const account = await findActiveAccount(email, platform);

    if (!account) {
      return res.status(400).json({
        message: "Invalid or expired verification code.",
      });
    }

    const tokenData = readVerificationToken(verificationToken);
    if (
      !tokenData ||
      tokenData.accountId !== account.account_id ||
      tokenData.platform !== platform
    ) {
      return res.status(400).json({
        message: "Verification is required before resetting the password.",
      });
    }

    // Hashing before the transaction reduces lock duration.
    const passwordHash = await bcrypt.hash(password, 12);

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [records] = await connection.execute(
      `SELECT reset_id, attempt_count
       FROM tbl_password_reset
       WHERE reset_id = ?
         AND account_id = ?
         AND platform = ?
         AND used_at IS NULL
         AND expires_at > NOW()
       ORDER BY reset_id DESC
       LIMIT 1
       FOR UPDATE`,
      [tokenData.resetId, account.account_id, platform]
    );

    const record = records[0];

    if (!record || record.attempt_count >= MAX_ATTEMPTS) {
      await connection.rollback();
      return res.status(400).json({
        message: "Invalid or expired verification code.",
      });
    }

    await connection.execute(
      `UPDATE tbl_account
       SET password = ?
       WHERE account_id = ?`,
      [passwordHash, account.account_id]
    );

    await connection.execute(
      `UPDATE tbl_password_reset
       SET used_at = NOW()
       WHERE account_id = ?
         AND used_at IS NULL`,
      [account.account_id]
    );

    await connection.commit();

    return res.json({
      message: "Password updated successfully. Please log in.",
    });
  } catch (error) {
    if (connection) await connection.rollback();

    console.error("Reset password error:", error);

    return res.status(500).json({
      message: "Unable to reset password right now.",
    });
  } finally {
    if (connection) connection.release();
  }
}
