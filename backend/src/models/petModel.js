import { prisma } from "../config/prisma.js";

export const findPetByOwner = async (id) =>
    prisma.pet.findMany({
        where: {
            ownerId: id,
            isDeleted: false,
            owner: {
                is: {
                    isDeleted: false,
                    account: { is: { isDeleted: false } },
                },
            },
            breed: { is: { isDeleted: false } },
        },
        include: { breed: true },
    });

export const getPetCount = async () =>
    prisma.pet.count({
        where: {
            isDeleted: false,
            owner: {
                is: {
                    isDeleted: false,
                    account: { is: { isDeleted: false } },
                },
            },
            breed: { is: { isDeleted: false } },
        },
    });

export const findOwnerPet = (petId, ownerId) =>
    prisma.pet.findFirst({
        where: { petId, ownerId, isDeleted: false },
    });