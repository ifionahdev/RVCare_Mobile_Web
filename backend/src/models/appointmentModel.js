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

const appointmentInclude = {
  pet: {
    include: {
      breed: true,
      owner: true,
    },
  },
  service: true,
  timeslot: true,
  veterinarian: { include: { account: true } },
};

export const findOwnerAppointments = (accountId) =>
  prisma.appointment.findMany({
    where: {
      isDeleted: false,
      pet: { owner: { accountId } },
    },
    include: appointmentInclude,
    orderBy: [{ scheduledDate: "desc" }, { timeslotId: "asc" }],
  });

export const findAppointmentById = (appointmentId) =>
  prisma.appointment.findFirst({
    where: { appointmentId, isDeleted: false },
    include: appointmentInclude,
  });
