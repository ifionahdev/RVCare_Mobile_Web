import { prisma } from "../config/prisma.js";

export const findPetByOwner = async (id) =>
    prisma.pet.findMany({
        where: {
            ownerId: id,
            isDeleted: false,
        },
        include: { breed: true },
    });

export const getPetCount = async () =>
    prisma.pet.count({ where: { isDeleted: false } });