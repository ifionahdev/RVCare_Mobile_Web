import { prisma } from "../config/prisma.js";

const toDateOnly = (value) => value.toISOString().slice(0, 10);

export const findSuggestionVets = async () => {
  const vets = await prisma.veterinarian.findMany({
    where: { isDeleted: false },
    select: { vetId: true },
    orderBy: { vetId: "asc" },
  });

  return vets.map(({ vetId }) => vetId);
};

export const findSuggestionSchedule = async ({ fromDate, toDate, vetIds }) => {
  const [timeslots, appointments] = await Promise.all([
    prisma.timeslot.findMany({
      where: {
        startTime: { gte: "08:00", lt: "21:00" },
        endTime: { lte: "21:00", gt: "08:00" },
      },
      select: { timeslotId: true, startTime: true, endTime: true },
      orderBy: { startTime: "asc" },
    }),
    prisma.appointment.findMany({
      where: {
        vetId: { in: vetIds },
        scheduledDate: {
          gte: new Date(`${fromDate}T00:00:00.000Z`),
          lte: new Date(`${toDate}T00:00:00.000Z`),
        },
        status: {
          notIn: ["Cancelled", "Rejected", "Completed", "Missed", "Past"],
        },
        isDeleted: false,
      },
      select: {
        vetId: true,
        scheduledDate: true,
        timeslot: { select: { startTime: true } },
      },
    }),
  ]);

  const occupied = appointments
    .filter(({ timeslot }) => timeslot.startTime >= "08:00" && timeslot.startTime < "21:00")
    .map(({ vetId, scheduledDate, timeslot }) => ({
      vetId,
      date: toDateOnly(scheduledDate),
      hour: Number(timeslot.startTime.slice(0, 2)),
    }));

  return {
    vets: vetIds,
    timeslots,
    hours: timeslots.map(({ startTime }) => Number(startTime.slice(0, 2))),
    occupied,
    blocked: [],
  };
};
