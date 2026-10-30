import { prisma } from "../config/prisma.js";

export const findPetByOwner = async (id) =>
    prisma.pet.findMany({
        where: {
            ownerId: id,
            isDeleted: false,
        },
        include: { breed: true },
    });

export const findOwnerByAccount = async (accountId) =>
    prisma.petOwner.findFirst({
        where: {
            accountId,
            isDeleted: false,
        },
        select: {
            ownerId: true,
        },
    });