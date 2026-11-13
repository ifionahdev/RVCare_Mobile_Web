import { prisma } from "../config/prisma.js";

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
  prisma.$transaction(
    schedules.map((schedule) =>
      prisma.veterinarianSchedule.create({
        data: schedule,
        include: veterinarianInclude,
      }),
    ),
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

export const updateVeterinarianScheduleRecord = (scheduleId, data) =>
  prisma.veterinarianSchedule.update({
    where: { scheduleId },
    data,
    include: veterinarianInclude,
  });

export const softDeleteVeterinarianSchedule = (scheduleId) =>
  prisma.veterinarianSchedule.update({
    where: { scheduleId },
    data: { isDeleted: true },
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
  prisma.veterinarianTimeOff.create({
    data,
    include: veterinarianInclude,
  });

export const updateVeterinarianTimeOff = (timeOffId, data) =>
  prisma.veterinarianTimeOff.update({
    where: { timeOffId },
    data,
    include: veterinarianInclude,
  });

export const softDeleteVeterinarianTimeOff = (timeOffId) =>
  prisma.veterinarianTimeOff.update({
    where: { timeOffId },
    data: { isDeleted: true },
  });
