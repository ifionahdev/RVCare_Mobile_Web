import { prisma } from "../config/prisma.js";

export const profiles = {
  admin: { model: "admin", idField: "adminId"},
  vet: { model: "veterinarian", idField: "vetId"},
  customer: { model: "petOwner", idField: "ownerId"},
};

export const findProfileId = async (accountId, role) => {
  const profile = profiles[role];

  if (!profile) return null;

  const row = await prisma[profile.model].findFirst({
    where: { accountId, isDeleted: false },
    select: { [profile.idField]: true },
  });

  return row?.[profile.idField] ?? null;
};