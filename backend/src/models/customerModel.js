import {prisma} from '../config/prisma.js';

export const getCustomerCount = async () => 
    prisma.petOwner.count({
        where: {
            isDeleted: false,
            account: { is: { isDeleted: false } },
        },
    });

export const findCustomerByAccount = async (accountId) =>
    prisma.petOwner.findFirst({
        where: {
            accountId,
            isDeleted: false,
            account: { is: { isDeleted: false } },
        },
    });

export const findCustomerSettingsProfile = async (accountId) =>
    prisma.petOwner.findFirst({
        where: {
            accountId,
            isDeleted: false,
            account: { is: { isDeleted: false } },
        },
        select: {
            ownerId: true,
            accountId: true,
            account: {
                select: {
                    firstName: true,
                    lastName: true,
                    dateOfBirth: true,
                },
            },
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
                where: {
                    isDeleted: false,
                    breed: { is: { isDeleted: false } },
                },
                include: { breed: true },
                orderBy: { petId: "desc" },
            },
        },
    });