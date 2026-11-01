import { prisma } from "../config/prisma.js";

export const findAccountForLogin = async (username) => {
  const account = await prisma.account.findUnique({
    where: { username },
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
    where: { accountId: Number(id) },
    omit: { password: true },
    include: { role: { select: { roleSlug: true } } },
  });