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