import { prisma } from "../config/prisma.js";
import { createAuditLog } from "../services/auditLogService.js";

const activeAppointmentRelations = {
  pet: {
    is: {
      isDeleted: false,
      breed: { is: { isDeleted: false } },
      owner: {
        is: {
          isDeleted: false,
          account: { is: { isDeleted: false } },
        },
      },
    },
  },
  veterinarian: {
    is: {
      isDeleted: false,
      account: { is: { isDeleted: false } },
    },
  },
};

export const findBookedTimeslotIds = async ({
  scheduledDate,
  vetId,
  excludeAppointmentId,
}) =>
  prisma.appointment.findMany({
    where: {
      scheduledDate,
      isDeleted: false,
      ...(excludeAppointmentId === undefined
        ? {}
        : { appointmentId: { not: excludeAppointmentId } }),
      ...activeAppointmentRelations,
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

export const findTimeslotById = (timeslotId) =>
  prisma.timeslot.findUnique({ where: { timeslotId } });

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
      ...activeAppointmentRelations,
      pet: {
        is: {
          isDeleted: false,
          breed: { is: { isDeleted: false } },
          owner: {
            is: {
              accountId,
              isDeleted: false,
              account: { is: { isDeleted: false } },
            },
          },
        },
      },
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
      ...activeAppointmentRelations,
    },
    select: appointmentListSelect,
    orderBy: [{ scheduledDate: "desc" }, { timeslotId: "asc" }],
  });
};

export const findAppointmentById = (appointmentId) =>
  prisma.appointment.findFirst({
    where: { appointmentId, isDeleted: false, ...activeAppointmentRelations },
    include: appointmentInclude,
  });

export const createPendingAppointment = ({
  petId,
  serviceId,
  vetId,
  scheduledDate,
  timeslotId,
  accountId,
}) =>
  prisma.$transaction(async (tx) => {
    const appointment = await tx.appointment.create({
      data: {
        petId,
        serviceId,
        vetId,
        scheduledDate,
        timeslotId,
        status: "Pending",
      },
    });
    await createAuditLog(tx, {
      accountId,
      action: "Created",
      targetTable: "tbl_appointment",
      targetId: appointment.appointmentId,
      newValue: {
        petId: appointment.petId,
        serviceId: appointment.serviceId,
        vetId: appointment.vetId,
        scheduledDate: appointment.scheduledDate,
        timeslotId: appointment.timeslotId,
        status: appointment.status,
      },
    });
    return appointment;
  });

export const updateAppointmentSchedule = ({
  appointmentId,
  scheduledDate,
  timeslotId,
  vetId,
  accountId,
}) =>
  prisma.$transaction(async (tx) => {
    const current = await tx.appointment.findUniqueOrThrow({
      where: { appointmentId },
    });
    const updated = await tx.appointment.update({
      where: { appointmentId },
      data: {
        scheduledDate,
        timeslotId,
        ...(vetId === undefined ? {} : { vetId }),
      },
    });
    await createAuditLog(tx, {
      accountId,
      action: "Updated",
      targetTable: "tbl_appointment",
      targetId: appointmentId,
      oldValue: {
        scheduledDate: current.scheduledDate,
        timeslotId: current.timeslotId,
        vetId: current.vetId,
      },
      newValue: {
        scheduledDate: updated.scheduledDate,
        timeslotId: updated.timeslotId,
        vetId: updated.vetId,
      },
    });
    return updated;
  });

export const cancelAppointment = ({ appointmentId, accountId }) =>
  prisma.$transaction(async (tx) => {
    const current = await tx.appointment.findUniqueOrThrow({
      where: { appointmentId },
    });
    const updated = await tx.appointment.update({
      where: { appointmentId },
      data: { status: "Cancelled" },
    });
    await createAuditLog(tx, {
      accountId,
      action: "Updated",
      targetTable: "tbl_appointment",
      targetId: appointmentId,
      oldValue: { status: current.status },
      newValue: { status: updated.status },
    });
    return updated;
  });

export const getPendingAppointmentsCount = async () =>
  prisma.appointment.count({
    where: {
      isDeleted: false,
      status: "Pending",
      ...activeAppointmentRelations,
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
      ...activeAppointmentRelations,
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
      ...activeAppointmentRelations,
    },
    select: todaysUpcomingSelect,
    orderBy: { timeslot: {startTime: "asc"} },
  });
};

export const getAppointmentCountPerStatus = async () => {
  const STATUSES = ["Pending", "Upcoming", "Rejected", "Completed", "Missed", "Cancelled"];
  const rows = await prisma.appointment.groupBy({
    by: ["status"],
    where: { isDeleted: false, ...activeAppointmentRelations },
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
      ...activeAppointmentRelations,
    },
    include: appointmentInclude,
    orderBy: [{ scheduledDate: "desc" }, { timeslotId: "asc" }],
  });