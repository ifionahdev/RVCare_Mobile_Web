import { prisma } from "../config/prisma.js";

export const findAccountForLogin = async (username) =>
  prisma.account.findUnique({
    where: { username },
    include: { role: { select: { roleSlug: true } } },
  });

export const findAccountById = async (id) =>
  prisma.account.findUnique({
    where: { accountId: Number(id) },
    omit: { password: true },
    include: { role: { select: { roleSlug: true } } },
  });