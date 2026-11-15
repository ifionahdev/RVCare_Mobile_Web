
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { findAccountForLogin, findAccountById } from "../models/accountModel.js";
import { logActivity } from "../models/activityModel.js";
import { findProfileId } from "../models/profileModel.js";
import { prisma } from "../config/prisma.js";

const INVALID_CREDENTIALS = "Invalid username or password";

// A valid bcrypt hash used to equalize work for unknown usernames.
// It is not an actual account password.
const DUMMY_HASH =
  "$2b$12$C6UzMDM.H6dfI/f/IKcEeO0X9y9c5t4xY0bYqQvZxFzZxY0vQ1Y6S";

const allowedPlatforms = {
  web: ["admin", "vet"],
  mobile: ["customer"],
};
const profiles = {
  admin: { resultKey: "adminId" },
  vet: { resultKey: "vetId" },
  customer: { resultKey: "ownerId" },
};

const publicUser = (account, role, profileId) => {
  const profile = profiles[role];

  return {
    accountId: account.accountId,
    username: account.username,
    firstName: account.firstName,
    lastName: account.lastName,
    role,
    [profile.resultKey]: profileId,
  };
};

const validateLoginInput = (username, password) => {
  if (
    typeof username !== "string" ||
    !username.trim() ||
    typeof password !== "string" ||
    !password
  ) {
    return false;
  }
  return true;
};

const validateLoginPlatform = (platform) => {
  if (!["web", "mobile"].includes(platform)) {
    return false;
  }
  return true;
};

export const login = async (req, res, next) => {
  try {
    const { username, password, platform } = req.body ?? {};

    if (!validateLoginInput(username, password)) {
      return res.status(400).json({
        message: "Username and password are required.",
      });
    }

    if (!validateLoginPlatform(platform)) {
      return res.status(400).json({
        message: "Please use the RaphaCare web portal or mobile app to log in.",
      });
    }


    const account = await findAccountForLogin(username.trim());

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

    const role = account.roleSlug;
    const profileId = await findProfileId(account.accountId, role);

    if (!passwordValid || profileId === null) {
      await logActivity(
        account.accountId,
        "LOGIN_FAILED",
        platform
      );

      return res.status(401).json({
        message: INVALID_CREDENTIALS,
      });
    }

    if (!allowedPlatforms[platform].includes(role)) {
      await logActivity(
        account.accountId,
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
        subject: String(account.accountId),
        expiresIn: process.env.JWT_EXPIRES_IN || "8h",
        algorithm: "HS256",
      }
    );

    await logActivity( 
      account.accountId,
      "LOGIN",
      platform,
    );

    return res.status(200).json({ token, user });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    const account = await findAccountById(req.user.accountId);

    if (!account) {
      return res.status(401).json({
        message: "Session is no longer valid.",
      });
    }

    const role = account.roleSlug;
    const profileId = await findProfileId(account.accountId, role);

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

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body ?? {};
    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      typeof confirmPassword !== "string" ||
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({ message: "All password fields are required." });
    }

    if (
      newPassword.length < 8 ||
      newPassword.length > 72 ||
      !/[A-Z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword) ||
      !/[^A-Za-z0-9]/.test(newPassword)
    ) {
      return res.status(400).json({
        message: "The new password must be at least 8 characters and include an uppercase letter, a number, and a special character.",
      });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "The new password confirmation does not match." });
    }
    if (newPassword === currentPassword) {
      return res.status(400).json({ message: "Choose a password different from your current password." });
    }

    const account = await prisma.account.findFirst({
      where: { accountId: req.user.accountId, isDeleted: false },
      select: { password: true },
    });
    if (!account || !(await bcrypt.compare(currentPassword, account.password))) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    const password = await bcrypt.hash(newPassword, 12);
    await prisma.account.update({
      where: { accountId: req.user.accountId },
      data: { password },
    });

    return res.json({ message: "Password changed successfully." });
  } catch (error) {
    return next(error);
  }
};
