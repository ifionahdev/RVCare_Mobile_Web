import { prisma } from "../config/prisma.js";

export const findAccountForLogin = async (username) => {
  const account = await prisma.account.findFirst({
    where: { username, isDeleted: false },
    include: { role: { select: { roleSlug: true } } },
  });

  if (!account) return null;

  return {
    ...account,
    roleSlug: account.role.roleSlug,
  };
};

export const findAccountById = async (id) =>
  prisma.account.findUnique({
    where: { accountId: Number(id), isDeleted: false },
    omit: { password: true },
    include: { role: { select: { roleSlug: true } } },
  });