import { prisma } from "../config/prisma.js";

export const findAllVeterinarians = async () =>
  prisma.veterinarian.findMany({
    where: {
      isDeleted: false,
      account: {
        isDeleted: false,
      },
    },
    include: { account: true },
    orderBy: [
      { account: { lastName: "asc" } },
      { account: { firstName: "asc" } },
    ],
  });
