import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import { sendOwnerCredentials } from "../services/emailService.js";

const staffRoles = ["admin", "vet"];
const lastAdminDeletionCode = "LAST_ACTIVE_ADMIN";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const namePattern = /^[\p{L}\p{M}]+(?:[ '\-][\p{L}\p{M}]+)*$/u;

const success = (res, data, message, status = 200) =>
  res.status(status).json({ success: true, data, message });
const badRequest = (res, message) =>
  res.status(400).json({ success: false, message });
const conflict = (res, message) =>
  res.status(409).json({ success: false, message });
const notFound = (res, message) =>
  res.status(404).json({ success: false, message });

const positiveInteger = (value) => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

const includeStaffProfile = {
  role: { select: { roleSlug: true } },
  admin: { select: { isDeleted: true } },
  veterinarian: { select: { isDeleted: true } },
};

const isActiveStaffProfile = (account) => {
  if (account.role.roleSlug === "admin") {
    return account.admin && !account.admin.isDeleted;
  }
  if (account.role.roleSlug === "vet") {
    return account.veterinarian && !account.veterinarian.isDeleted;
  }
  return false;
};

const staffDto = (account) => ({
  id: account.accountId,
  type: account.role.roleSlug === "admin" ? "admin" : "veterinarian",
  firstName: account.firstName,
  lastName: account.lastName,
  email: account.email,
  createdAt: account.dateRegistered,
});

const readStaffFields = (body = {}, includeType = false) => {
  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const type = body.type;

  if (!namePattern.test(firstName) || firstName.length > 100) {
    return { error: "Enter a valid first name of 100 characters or fewer." };
  }
  if (!namePattern.test(lastName) || lastName.length > 100) {
    return { error: "Enter a valid last name of 100 characters or fewer." };
  }
  if (!emailPattern.test(email) || email.length > 50) {
    return { error: "Enter a valid email address of 50 characters or fewer." };
  }
  if (includeType && !["admin", "veterinarian"].includes(type)) {
    return { error: "Select either an admin or veterinarian account type." };
  }

  return {
    data: {
      firstName,
      lastName,
      email,
      ...(includeType ? { type } : {}),
    },
  };
};

const findManagedStaffAccount = async (accountId) => {
  const account = await prisma.account.findFirst({
    where: {
      accountId,
      isDeleted: false,
      role: { is: { roleSlug: { in: staffRoles } } },
    },
    include: includeStaffProfile,
  });
  return account && isActiveStaffProfile(account) ? account : null;
};

const accountConflict = (error) => error?.code === "P2002";

export const getManagedStaffAccounts = async (req, res, next) => {
  try {
    const accounts = await prisma.account.findMany({
      where: {
        isDeleted: false,
        role: { is: { roleSlug: { in: staffRoles } } },
      },
      include: includeStaffProfile,
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });
    const staff = accounts.filter(isActiveStaffProfile).map(staffDto);

    return success(res, {
      admins: staff.filter((account) => account.type === "admin"),
      veterinarians: staff.filter((account) => account.type === "veterinarian"),
    }, "Staff accounts retrieved.");
  } catch (error) {
    return next(error);
  }
};

export const createManagedStaffAccount = async (req, res, next) => {
  try {
    const fields = readStaffFields(req.body, true);
    if (fields.error) return badRequest(res, fields.error);

    const existing = await prisma.account.findFirst({
      where: {
        OR: [
          { email: fields.data.email },
          { username: fields.data.email },
        ],
      },
      select: { accountId: true },
    });
    if (existing) return conflict(res, "An account with this email already exists.");

    const roleSlug = fields.data.type === "admin" ? "admin" : "vet";
    const role = await prisma.role.findUnique({ where: { roleSlug } });
    if (!role) return notFound(res, "The selected account role is not configured.");

    const temporaryPassword = crypto.randomBytes(12).toString("base64url");
    const password = await bcrypt.hash(temporaryPassword, 12);
    const account = await prisma.$transaction(async (tx) => {
      const created = await tx.account.create({
        data: {
          roleId: role.roleId,
          username: fields.data.email,
          email: fields.data.email,
          password,
          firstName: fields.data.firstName,
          lastName: fields.data.lastName,
        },
      });

      if (roleSlug === "admin") {
        await tx.admin.create({ data: { accountId: created.accountId } });
      } else {
        await tx.veterinarian.create({ data: { accountId: created.accountId } });
      }

      return tx.account.findUniqueOrThrow({
        where: { accountId: created.accountId },
        include: includeStaffProfile,
      });
    });

    let emailSent = true;
    try {
      await sendOwnerCredentials(account.email, temporaryPassword);
    } catch (error) {
      emailSent = false;
      console.error(
        `[account-management] Credential email failed for account ${account.accountId}:`,
        error.message,
      );
    }

    return res.status(201).json({
      success: true,
      data: staffDto(account),
      message: "Staff account created successfully.",
      emailSent,
      ...(!emailSent ? { generatedPassword: temporaryPassword } : {}),
    });
  } catch (error) {
    if (accountConflict(error)) {
      return conflict(res, "An account with this email already exists.");
    }
    return next(error);
  }
};

export const updateManagedStaffAccount = async (req, res, next) => {
  try {
    const accountId = positiveInteger(req.params.accountId);
    if (!accountId) return badRequest(res, "Invalid account ID.");

    const existing = await findManagedStaffAccount(accountId);
    if (!existing) return notFound(res, "Staff account not found.");

    const fields = readStaffFields(req.body);
    if (fields.error) return badRequest(res, fields.error);
    const duplicate = await prisma.account.findFirst({
      where: {
        accountId: { not: accountId },
        OR: [{ email: fields.data.email }, { username: fields.data.email }],
      },
      select: { accountId: true },
    });
    if (duplicate) return conflict(res, "An account with this email already exists.");

    const updated = await prisma.account.update({
      where: { accountId },
      data: {
        firstName: fields.data.firstName,
        lastName: fields.data.lastName,
        email: fields.data.email,
        username: fields.data.email,
      },
      include: includeStaffProfile,
    });
    return success(res, staffDto(updated), "Staff account updated successfully.");
  } catch (error) {
    if (accountConflict(error)) {
      return conflict(res, "An account with this email already exists.");
    }
    return next(error);
  }
};

export const deleteManagedStaffAccount = async (req, res, next) => {
  try {
    const accountId = positiveInteger(req.params.accountId);
    if (!accountId) return badRequest(res, "Invalid account ID.");
    if (accountId === Number(req.user.accountId)) {
      return conflict(res, "You cannot delete the account you are currently using.");
    }

    const account = await findManagedStaffAccount(accountId);
    if (!account) return notFound(res, "Staff account not found.");

    await prisma.$transaction(async (tx) => {
      if (account.role.roleSlug === "admin") {
        const activeAdminCount = await tx.admin.count({
          where: {
            isDeleted: false,
            account: { is: { isDeleted: false } },
          },
        });
        if (activeAdminCount <= 1) {
          const error = new Error("The last active admin account cannot be deleted.");
          error.code = lastAdminDeletionCode;
          throw error;
        }
        await tx.admin.update({
          where: { accountId },
          data: { isDeleted: true },
        });
      } else {
        await tx.veterinarian.update({
          where: { accountId },
          data: { isDeleted: true },
        });
      }
      await tx.account.update({
        where: { accountId },
        data: { isDeleted: true },
      });
    });

    return success(res, null, "Staff account deleted successfully.");
  } catch (error) {
    if (error.code === lastAdminDeletionCode) {
      return conflict(res, error.message);
    }
    return next(error);
  }
};
