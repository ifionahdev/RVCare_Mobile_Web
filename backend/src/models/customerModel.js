import {prisma} from '../config/prisma.js';

export const getCustomerCount = async () => 
    prisma.petOwner.count({ where: { isDeleted: false } });

export const findCustomerByAccount = async (accountId) =>
    prisma.petOwner.findFirst({
        where: {
            accountId,
            isDeleted: false,
        },
    });

export const findActiveCustomersWithPets = () =>
    prisma.petOwner.findMany({
        where: {
            isDeleted: false,
            account: { isDeleted: false },
        },
        orderBy: { ownerId: "desc" },
        include: {
            account: true,
            pets: {
                where: { isDeleted: false },
                include: { breed: true },
                orderBy: { petId: "desc" },
            },
        },
    });