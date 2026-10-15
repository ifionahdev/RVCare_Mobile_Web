
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

const INVALID_CREDENTIALS = "Invalid username or password";

// A valid bcrypt hash used to equalize work for unknown usernames.
// It is not an actual account password.
const DUMMY_HASH =
  "$2b$12$C6UzMDM.H6dfI/f/IKcEeO0X9y9c5t4xY0bYqQvZxFzZxY0vQ1Y6S";

const profiles = {
  admin: {
    table: "tbl_admin",
    idColumn: "admin_id",
    resultKey: "adminId",
  },
  vet: {
    table: "tbl_veterinarian",
    idColumn: "vet_id",
    resultKey: "vetId",
  },
  customer: {
    table: "tbl_pet_owner",
    idColumn: "owner_id",
    resultKey: "ownerId",
  },
};

const allowedPlatforms = {
  web: ["admin", "vet"],
  mobile: ["customer"],
};

const publicUser = (account, role, profileId) => {
  const profile = profiles[role];

  return {
    accountId: account.account_id,
    username: account.username,
    firstName: account.first_name,
    lastName: account.last_name,
    role,
    [profile.resultKey]: profileId,
  };
};

const findAccount = async (accountIdOrUsername, byId = false) => {
  const column = byId ? "a.account_id" : "a.username";

  const [rows] = await pool.execute(
    `SELECT
       a.account_id,
       a.username,
       a.password,
       a.first_name,
       a.last_name,
       r.role_slug
     FROM tbl_account AS a
     INNER JOIN tbl_role AS r
       ON r.role_id = a.role_id
     WHERE ${column} = ?
     LIMIT 1`,
    [accountIdOrUsername]
  );

  return rows[0] ?? null;
};

const findProfileId = async (accountId, role) => {
  const profile = profiles[role];

  if (!profile) return null;

  // Table and column names come only from this fixed whitelist.
  const [rows] = await pool.execute(
    `SELECT ${profile.idColumn} AS profile_id
     FROM ${profile.table}
     WHERE account_id = ?
       AND is_deleted = 0
     LIMIT 1`,
    [accountId]
  );

  return rows[0]?.profile_id ?? null;
};

const logActivity = async (accountId, action, source) => {
  await pool.execute(
    `INSERT INTO tbl_activity_log
       (account_id, action, source)
     VALUES (?, ?, ?)`,
    [accountId, action, source]
  );
};

export const login = async (req, res, next) => {
  try {
    const { username, password, platform } = req.body ?? {};

    if (
      typeof username !== "string" ||
      !username.trim() ||
      typeof password !== "string" ||
      !password ||
      !["web", "mobile"].includes(platform)
    ) {
      return res.status(400).json({
        message: "Username, password and a valid platform are required.",
      });
    }

    const account = await findAccount(username.trim());

    if (!account) {
      await bcrypt.compare(password, DUMMY_HASH);

      return res.status(401).json({
        message: INVALID_CREDENTIALS,
      });
    }

    const passwordValid = await bcrypt.compare(
      password,
      account.password
    );

    const role = account.role_slug;
    const profileId = await findProfileId(account.account_id, role);

    if (!passwordValid || profileId === null) {
      await logActivity(
        account.account_id,
        "LOGIN_FAILED",
        platform
      );

      return res.status(401).json({
        message: INVALID_CREDENTIALS,
      });
    }

    if (!allowedPlatforms[platform].includes(role)) {
      await logActivity(
        account.account_id,
        "LOGIN_FAILED",
        platform
      );

      return res.status(403).json({
        message:
          platform === "web"
            ? "Please use the RaphaCare mobile app."
            : "Please use the RaphaCare web portal.",
      });
    }

    const user = publicUser(account, role, profileId);

    const token = jwt.sign(
      {
        role,
        [profiles[role].resultKey]: profileId,
      },
      process.env.JWT_SECRET,
      {
        subject: String(account.account_id),
        expiresIn: process.env.JWT_EXPIRES_IN || "8h",
        algorithm: "HS256",
      }
    );

    await logActivity(account.account_id, "LOGIN", platform);

    return res.status(200).json({ token, user });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    const account = await findAccount(req.user.accountId, true);

    if (!account) {
      return res.status(401).json({
        message: "Session is no longer valid.",
      });
    }

    const role = account.role_slug;
    const profileId = await findProfileId(account.account_id, role);

    if (
      profileId === null ||
      role !== req.user.role ||
      profileId !== req.user.profileId
    ) {
      return res.status(401).json({
        message: "Session is no longer valid.",
      });
    }

    return res.json({
      user: publicUser(account, role, profileId),
    });
  } catch (error) {
    next(error);
  }
};
