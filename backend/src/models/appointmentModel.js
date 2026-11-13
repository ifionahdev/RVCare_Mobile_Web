import { prisma } from "../config/prisma.js";

export const findBookedTimeslotIds = async ({ scheduledDate, vetId }) =>
  prisma.appointment.findMany({
    where: {
      scheduledDate,
      isDeleted: false,
      status: {
        notIn: ["Cancelled", "Rejected", "Completed", "Missed"],
      },
      ...(vetId === undefined ? {} : { vetId }),
    },
    select: {
      timeslotId: true,
      vetId: true,
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

export const expirePastAppointments = () =>
  prisma.appointment.updateMany({
    where: {
      isDeleted: false,
      scheduledDate: { lt: getTodayManilaDate() },
      status: { in: ["Pending", "Upcoming"] },
    },
    data: { status: "Missed" },
  });

export const findOwnerAppointments = async (accountId) => {
  await expirePastAppointments();
  return prisma.appointment.findMany({
    where: {
      isDeleted: false,
      pet: { owner: { accountId } },
    },
    include: appointmentInclude,
    orderBy: [{ scheduledDate: "desc" }, { timeslotId: "asc" }],
  });
};

const appointmentListSelect = {
  appointmentId: true,
  scheduledDate: true,
  status: true,
  timeslot: { select: { display: true } },
  service: { select: { serviceName: true } },
  pet: {
    select: {
      petName: true,
      owner: { select: { account: { select: { firstName: true, lastName: true } } } },
    },
  },
  veterinarian: {
    select: { account: { select: { firstName: true, lastName: true } } },
  },
};

export const findAllAppointments = async () => {
  await expirePastAppointments();
  return prisma.appointment.findMany({
    where: {
      isDeleted: false,
      status: { not: "Pending" },
    },
    select: appointmentListSelect,
    orderBy: [{ scheduledDate: "desc" }, { timeslotId: "asc" }],
  });
};

export const findAppointmentById = (appointmentId) =>
  prisma.appointment.findFirst({
    where: { appointmentId, isDeleted: false },
    include: appointmentInclude,
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

const getTodayManilaDate = () => {
  const todayManila = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Manila",
  });
  return new Date(`${todayManila}T00:00:00.000Z`);
};

export const getTodaysAppointmentsCount = () => {

  return prisma.appointment.count({
    where: {
      isDeleted: false,
      scheduledDate: getTodayManilaDate(),
      status: {
        notIn: ["Cancelled", "Pending", "Rejected"],
      }
    },
  });
};

const todaysUpcomingSelect = {
  appointmentId: true,
  timeslot: { select: { display: true } },
  pet: { select: { petName: true } },
  service: { select: { serviceName: true } },
  veterinarian: {
    select: { account: { select: { firstName: true, lastName: true } } },
  },
};

export const findTodaysUpcomingAppointments = () => {
  return prisma.appointment.findMany({
    where: {
      isDeleted: false,
      scheduledDate: getTodayManilaDate(),
      status: "Upcoming",
    },
    select: todaysUpcomingSelect,
    orderBy: { timeslot: {startTime: "asc"} },
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

export const findRecentPendingAppointments = () =>
  prisma.appointment.findMany({
    where: {
      isDeleted: false,
      status: "Pending",
    },
    include: appointmentInclude,
    orderBy: [{ scheduledDate: "desc" }, { timeslotId: "asc" }],
  });