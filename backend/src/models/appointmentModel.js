import { prisma } from "../config/prisma.js";

export const findBookedTimeslotIds = async ({ scheduledDate, vetId }) =>
  prisma.appointment.findMany({
    where: {
      scheduledDate,
      isDeleted: false,
      status: {
        not: "Cancelled",
        not: "Pending",
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

export const findAllAppointments = () =>
  prisma.appointment.findMany({
    where: {
      isDeleted: false,
      status: { not: "Pending" },
    },
    include: appointmentInclude,
    orderBy: [{ scheduledDate: "desc" }, { timeslotId: "asc" }],
  });

export const findAppointmentById = (appointmentId) =>
  prisma.appointment.findFirst({
    where: { appointmentId, isDeleted: false },
    include: appointmentInclude,
  });

export const findOwnerPet = (petId, ownerId) =>
  prisma.pet.findFirst({
    where: { petId, ownerId, isDeleted: false },
  });

export const findFirstAvailableVeterinarian = () =>
  prisma.veterinarian.findFirst({
    where: { isDeleted: false },
    select: { vetId: true },
    orderBy: { vetId: "asc" },
  });

export const createPendingAppointment = ({
  petId,
  serviceId,
  vetId,
  scheduledDate,
  timeslotId,
}) =>
  prisma.appointment.create({
    data: {
      petId,
      serviceId,
      vetId,
      scheduledDate,
      timeslotId,
      status: "Pending",
    },
  });

export const updateAppointmentSchedule = ({
  appointmentId,
  scheduledDate,
  timeslotId,
  vetId,
}) =>
  prisma.appointment.update({
    where: { appointmentId },
    data: {
      scheduledDate,
      timeslotId,
      ...(vetId === undefined ? {} : { vetId }),
    },
  });

export const getPendingAppointmentsCount = async () =>
  prisma.appointment.count({
    where: {
      isDeleted: false,
      status: "Pending",
    },
  });

export const getTodaysAppointmentsCount = () => {
  const todayManila = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Manila",
  });

  return prisma.appointment.count({
    where: {
      isDeleted: false,
      scheduledDate: new Date(`${todayManila}T00:00:00.000Z`),
      status: {
        not: "Cancelled",
        not: "Pending",
        not: "Rejected",
      }
    },
  });
};

export const getAppointmentCountPerStatus = async () => {
  const STATUSES = ["Pending", "Upcoming", "Rejected", "Completed", "Missed", "Cancelled"];
  const rows = await prisma.appointment.groupBy({
    by: ["status"],
    where: { isDeleted: false },
    _count: { _all: true },
  });

  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  for (const row of rows) counts[row.status] = row._count._all;
  return counts;
};