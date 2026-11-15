import {
  findCustomerSettingsProfile,
  getCustomerCount as countCustomers,
} from "../models/customerModel.js";
import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import { createAuditLog } from "../services/auditLogService.js";
import { readCustomerProfileUpdate } from "../services/customerSettingsPolicy.js";

export const getMyProfile = async (req, res, next) => {
  try {
    const customer = await findCustomerSettingsProfile(req.user.accountId);

    if (!customer) {
      return res.status(404).json({ message: "Customer profile not found." });
    }

    return res.json(customer);
  } catch (error) {
    return next(error);
  }
};

export const updateMyProfile = async (req, res, next) => {
  try {
    const profileUpdate = readCustomerProfileUpdate(req.body);
    if (profileUpdate.error) {
      return res.status(400).json({ message: profileUpdate.error });
    }
    const { firstName, lastName, dateOfBirth } = profileUpdate;

    const updated = await prisma.$transaction(async (tx) => {
      const owner = await tx.petOwner.findFirst({
        where: {
          accountId: req.user.accountId,
          isDeleted: false,
          account: { is: { isDeleted: false } },
        },
        select: {
          ownerId: true,
          account: {
            select: {
              firstName: true,
              lastName: true,
              dateOfBirth: true,
            },
          },
        },
      });
      if (!owner) return false;

      const oldValue = {
        firstName: owner.account.firstName,
        lastName: owner.account.lastName,
        dateOfBirth: owner.account.dateOfBirth,
      };
      const newValue = { firstName, lastName, dateOfBirth };

      await tx.account.update({
        where: { accountId: req.user.accountId },
        data: newValue,
      });
      await createAuditLog(tx, {
        accountId: req.user.accountId,
        action: "Updated",
        targetTable: "tbl_account",
        targetId: req.user.accountId,
        oldValue,
        newValue,
      });
      return true;
    });

    if (!updated) {
      return res.status(404).json({ message: "Customer profile not found." });
    }

    const profile = await findCustomerSettingsProfile(req.user.accountId);
    return res.json({ message: "Profile updated successfully.", data: profile });
  } catch (error) {
    return next(error);
  }
};

const activityLogEntry = (entry) => {
  const labels = {
    LOGIN: ["Signed in", `Signed in from ${entry.source}.`],
    LOGIN_FAILED: ["Failed sign-in", `Unsuccessful sign-in from ${entry.source}.`],
    PASSWORD_CHANGED: ["Password changed", "Your account password was updated."],
  };
  const [title, detail] = labels[entry.action] ?? [
    "Account activity",
    entry.action.replace(/_/g, " ").toLowerCase(),
  ];

  return {
    id: `activity-${entry.activityId}`,
    title,
    detail,
    createdAt: entry.createdAt,
  };
};

const auditLogEntry = (entry, currentAccountId) => {
  const targets = {
    tbl_account: "Account details",
    tbl_pet_owner: "Pet-owner profile",
    tbl_pet: "Pet profile",
  };
  const target = targets[entry.targetTable] ?? "Account data";
  const verb = entry.action.toLowerCase();

  return {
    id: `audit-${entry.auditId}`,
    title: `${target} ${verb}`,
    detail: `${target} ${verb} by ${entry.accountId === currentAccountId ? "you" : "clinic staff"}.`,
    createdAt: entry.createdAt,
  };
};

export const getMyActivity = async (req, res, next) => {
  try {
    const profile = await findCustomerSettingsProfile(req.user.accountId);
    if (!profile) {
      return res.status(404).json({ message: "Customer profile not found." });
    }

    const [activityLogs, auditLogs] = await Promise.all([
      prisma.activityLog.findMany({
        where: { accountId: req.user.accountId },
        select: {
          activityId: true,
          action: true,
          source: true,
          createdAt: true,
        },
        orderBy: [{ createdAt: "desc" }, { activityId: "desc" }],
        take: 50,
      }),
      prisma.auditLog.findMany({
        where: {
          OR: [
            { accountId: req.user.accountId },
            { targetTable: "tbl_account", targetId: req.user.accountId },
            { targetTable: "tbl_pet_owner", targetId: profile.ownerId },
          ],
        },
        select: {
          auditId: true,
          action: true,
          targetTable: true,
          targetId: true,
          accountId: true,
          createdAt: true,
        },
        orderBy: [{ createdAt: "desc" }, { auditId: "desc" }],
        take: 50,
      }),
    ]);

    const activities = [
      ...activityLogs.map(activityLogEntry),
      ...auditLogs.map((entry) => auditLogEntry(entry, req.user.accountId)),
    ]
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
      .slice(0, 50);

    return res.json({ activities });
  } catch (error) {
    return next(error);
  }
};

export const deleteMyAccount = async (req, res, next) => {
  try {
    const { currentPassword } = req.body ?? {};
    if (typeof currentPassword !== "string" || !currentPassword) {
      return res.status(400).json({ message: "Your current password is required." });
    }

    const account = await prisma.account.findFirst({
      where: { accountId: req.user.accountId, isDeleted: false },
      select: {
        password: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });
    if (!account) {
      return res.status(404).json({ message: "Customer account not found." });
    }
    if (!(await bcrypt.compare(currentPassword, account.password))) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    const deleted = await prisma.$transaction(async (tx) => {
      const owner = await tx.petOwner.findFirst({
        where: {
          accountId: req.user.accountId,
          isDeleted: false,
          account: { is: { isDeleted: false } },
        },
        select: {
          ownerId: true,
          address: true,
          contactNumber: true,
        },
      });
      if (!owner) return false;

      await tx.account.update({
        where: { accountId: req.user.accountId },
        data: { isDeleted: true },
      });
      await tx.petOwner.update({
        where: { accountId: req.user.accountId },
        data: { isDeleted: true },
      });
      await createAuditLog(tx, {
        accountId: req.user.accountId,
        action: "Deleted",
        targetTable: "tbl_account",
        targetId: req.user.accountId,
        oldValue: {
          firstName: account.firstName,
          lastName: account.lastName,
          email: account.email,
          isDeleted: false,
        },
        newValue: {
          firstName: account.firstName,
          lastName: account.lastName,
          email: account.email,
          isDeleted: true,
        },
      });
      await createAuditLog(tx, {
        accountId: req.user.accountId,
        action: "Deleted",
        targetTable: "tbl_pet_owner",
        targetId: owner.ownerId,
        oldValue: {
          address: owner.address,
          contactNumber: owner.contactNumber,
          isDeleted: false,
        },
        newValue: {
          address: owner.address,
          contactNumber: owner.contactNumber,
          isDeleted: true,
        },
      });
      return true;
    });

    if (!deleted) {
      return res.status(404).json({ message: "Customer profile not found." });
    }

    return res.json({ message: "Account deleted successfully." });
  } catch (error) {
    return next(error);
  }
};

export const getCustomerCount = async (req, res, next) => {
  try {
    const count = await countCustomers();
    return res.json({ count });
  } catch (error) {
    return next(error);
  }
};