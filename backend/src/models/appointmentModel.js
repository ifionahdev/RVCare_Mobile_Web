import { prisma } from "../config/prisma.js";

export const findBookedTimeslotIds = async ({ scheduledDate, vetId }) =>
  prisma.appointment.findMany({
    where: {
      scheduledDate,
      isDeleted: false,
      status: {
        not: "Cancelled",
      },
      ...(vetId === undefined ? {} : { vetId }),
    },
    select: {
      timeslotId: true,
    },
  });
