import { prisma } from "../config/prisma.js";
import { slotKey, HOURS_START, HOURS_END } from "../config/slots.js";

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
          notIn: ["Cancelled", "Rejected", "Completed", "Missed"],
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

  const hourOf = (t) => {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(t)) throw new Error(`Bad timeslot format: "${t}"`);
    return Number(t.slice(0, 2));
  };
  const inHours = (h) => h >= HOURS_START && h < HOURS_END;

  const occupied = [];
  for (const { vetId, scheduledDate, timeslot } of appointments) {
    const hour = hourOf(timeslot.startTime);
    if (inHours(hour)) occupied.push({ vetId, date: toDateOnly(scheduledDate), hour });
  }

  return {
    vets: vetIds,
    timeslots,
    hours: [...new Set(timeslots.map(({ startTime }) => hourOf(startTime)))]
      .filter(inHours)
      .sort((a, b) => a - b),
    occupied, // array of { vetId, date, hour }; the service turns it into a Set
    blocked: [], // no blocked-periods table yet
  };
};
