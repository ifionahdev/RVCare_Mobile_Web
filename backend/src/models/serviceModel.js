import {prisma} from "../config/prisma.js";     

export const getAllServices = async () =>
    prisma.service.findMany({
        select: {
            serviceId: true,
            serviceName: true,
        }
    });