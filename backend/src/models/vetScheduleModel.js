import { prisma } from "../config/prisma.js";
import { createAuditLog } from "../services/auditLogService.js";

const veterinarianInclude = {
  veterinarian: {
    select: {
      vetId: true,
      account: { select: { firstName: true, lastName: true } },
    },
  },
};

export const findActiveVeterinarian = (vetId) =>
  prisma.veterinarian.findFirst({
    where: { vetId, isDeleted: false },
    select: {
      vetId: true,
      account: { select: { firstName: true, lastName: true } },
    },
  });

export const findVeterinarianScheduleTimeOptions = () =>
  prisma.timeslot.findMany({
    select: { startTime: true, endTime: true },
    orderBy: { startTime: "asc" },
  });

export const findVeterinarianSchedules = () =>
  prisma.veterinarianSchedule.findMany({
    where: {
      isDeleted: false,
      veterinarian: { isDeleted: false },
    },
    include: veterinarianInclude,
    orderBy: [{ vetId: "asc" }, { dayOfWeek: "asc" }],
  });

export const findScheduleConflict = ({ vetId, dayOfWeek, exceptScheduleId }) =>
  prisma.veterinarianSchedule.findFirst({
    where: {
      vetId,
      dayOfWeek,
      isDeleted: false,
      ...(exceptScheduleId === undefined
        ? {}
        : { scheduleId: { not: exceptScheduleId } }),
    },
    select: { scheduleId: true },
  });

export const createVeterinarianSchedules = (schedules) =>
  prisma.$transaction(async (tx) =>
    Promise.all(schedules.map(async (schedule) => {
      const created = await tx.veterinarianSchedule.create({
        data: schedule,
        include: veterinarianInclude,
      });
      await createAuditLog(tx, {
        accountId: schedule.assignerId,
        action: "Created",
        targetTable: "tbl_veterinarian_schedule",
        targetId: created.scheduleId,
        newValue: {
          vetId: created.vetId,
          dayOfWeek: created.dayOfWeek,
          startTime: created.startTime,
          endTime: created.endTime,
          note: created.note,
        },
      });
      return created;
    })),
  );

export const findActiveVeterinarianSchedule = (scheduleId) =>
  prisma.veterinarianSchedule.findFirst({
    where: { scheduleId, isDeleted: false },
    select: { scheduleId: true },
  });

export const findActiveVeterinarianScheduleForDay = (vetId, dayOfWeek) =>
  prisma.veterinarianSchedule.findFirst({
    where: { vetId, dayOfWeek, isDeleted: false },
    select: { scheduleId: true },
  });

export const updateVeterinarianScheduleRecord = (scheduleId, data, accountId) =>
  prisma.$transaction(async (tx) => {
    const current = await tx.veterinarianSchedule.findUniqueOrThrow({
      where: { scheduleId },
    });
    const updated = await tx.veterinarianSchedule.update({
      where: { scheduleId },
      data,
      include: veterinarianInclude,
    });
    await createAuditLog(tx, {
      accountId,
      action: "Updated",
      targetTable: "tbl_veterinarian_schedule",
      targetId: scheduleId,
      oldValue: {
        vetId: current.vetId,
        dayOfWeek: current.dayOfWeek,
        startTime: current.startTime,
        endTime: current.endTime,
        note: current.note,
      },
      newValue: {
        vetId: updated.vetId,
        dayOfWeek: updated.dayOfWeek,
        startTime: updated.startTime,
        endTime: updated.endTime,
        note: updated.note,
      },
    });
    return updated;
  });

export const softDeleteVeterinarianSchedule = (scheduleId, accountId) =>
  prisma.$transaction(async (tx) => {
    const current = await tx.veterinarianSchedule.findUniqueOrThrow({
      where: { scheduleId },
    });
    await tx.veterinarianSchedule.update({
      where: { scheduleId },
      data: { isDeleted: true },
    });
    await createAuditLog(tx, {
      accountId,
      action: "Deleted",
      targetTable: "tbl_veterinarian_schedule",
      targetId: scheduleId,
      oldValue: {
        vetId: current.vetId,
        dayOfWeek: current.dayOfWeek,
        startTime: current.startTime,
        endTime: current.endTime,
        note: current.note,
        isDeleted: false,
      },
      newValue: {
        vetId: current.vetId,
        dayOfWeek: current.dayOfWeek,
        startTime: current.startTime,
        endTime: current.endTime,
        note: current.note,
        isDeleted: true,
      },
    });
  });

export const findVeterinarianTimeOff = () =>
  prisma.veterinarianTimeOff.findMany({
    where: {
      isDeleted: false,
      veterinarian: { isDeleted: false },
    },
    include: veterinarianInclude,
    orderBy: [{ date: "asc" }, { vetId: "asc" }],
  });

export const findActiveVeterinarianTimeOff = (timeOffId) =>
  prisma.veterinarianTimeOff.findFirst({
    where: { timeOffId, isDeleted: false },
    select: { timeOffId: true },
  });

export const createVeterinarianTimeOff = (data) =>
  prisma.$transaction(async (tx) => {
    const created = await tx.veterinarianTimeOff.create({
      data,
      include: veterinarianInclude,
    });
    await createAuditLog(tx, {
      accountId: data.reviewerId,
      action: "Created",
      targetTable: "tbl_veterinarian_time_off",
      targetId: created.timeOffId,
      newValue: {
        vetId: created.vetId,
        date: created.date,
        startTime: created.startTime,
        endTime: created.endTime,
        status: created.status,
        reason: created.reason,
        note: created.note,
      },
    });
    return created;
  });

export const updateVeterinarianTimeOff = (timeOffId, data) =>
  prisma.$transaction(async (tx) => {
    const current = await tx.veterinarianTimeOff.findUniqueOrThrow({
      where: { timeOffId },
    });
    const updated = await tx.veterinarianTimeOff.update({
      where: { timeOffId },
      data,
      include: veterinarianInclude,
    });
    await createAuditLog(tx, {
      accountId: data.reviewerId,
      action: "Updated",
      targetTable: "tbl_veterinarian_time_off",
      targetId: timeOffId,
      oldValue: {
        vetId: current.vetId,
        date: current.date,
        startTime: current.startTime,
        endTime: current.endTime,
        status: current.status,
        reason: current.reason,
        note: current.note,
      },
      newValue: {
        vetId: updated.vetId,
        date: updated.date,
        startTime: updated.startTime,
        endTime: updated.endTime,
        status: updated.status,
        reason: updated.reason,
        note: updated.note,
      },
    });
    return updated;
  });

export const softDeleteVeterinarianTimeOff = (timeOffId, accountId) =>
  prisma.$transaction(async (tx) => {
    const current = await tx.veterinarianTimeOff.findUniqueOrThrow({
      where: { timeOffId },
    });
    await tx.veterinarianTimeOff.update({
      where: { timeOffId },
      data: { isDeleted: true },
    });
    await createAuditLog(tx, {
      accountId,
      action: "Deleted",
      targetTable: "tbl_veterinarian_time_off",
      targetId: timeOffId,
      oldValue: {
        vetId: current.vetId,
        date: current.date,
        startTime: current.startTime,
        endTime: current.endTime,
        status: current.status,
        reason: current.reason,
        note: current.note,
        isDeleted: false,
      },
      newValue: {
        vetId: current.vetId,
        date: current.date,
        startTime: current.startTime,
        endTime: current.endTime,
        status: current.status,
        reason: current.reason,
        note: current.note,
        isDeleted: true,
      },
    });
  });
