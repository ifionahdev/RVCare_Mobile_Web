import { prisma } from "../config/prisma.js";

export const findAllVeterinarians = async () =>
  prisma.veterinarian.findMany({
    where: {
      isDeleted: false,
    },
    include: { account: true },
    orderBy: [
      { account: { lastName: "asc" } },
      { account: { firstName: "asc" } },
    ],
  });

export const findFirstAvailableVeterinarian = () =>
  prisma.veterinarian.findFirst({
    where: { isDeleted: false },
    select: { vetId: true },
    orderBy: { vetId: "asc" },
  });
