import { prisma } from "../config/prisma.js";
import { HOURS_START, HOURS_END, slotKey } from "../config/slots.js";

const BLOCKING_STATUS = "Upcoming";

const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

const toDateOnly = (value) => value.toISOString().slice(0, 10);
const toUtcMidnight = (dateStr) => new Date(`${dateStr}T00:00:00.000Z`);

// Fails loudly on a malformed row instead of silently building a wrong schedule.
const hourOf = (startTime) => {
  if (!HH_MM.test(startTime)) {
    throw new Error(`Bad timeslot format: "${startTime}" (expected HH:mm)`);
  }
  return Number(startTime.slice(0, 2));
};

const inClinicHours = (hour) => hour >= HOURS_START && hour < HOURS_END;

// ---------- Timeslots: fixed rows, loaded once and cached ----------
let timeslotHoursPromise = null;

const loadClinicHours = () => {
  if (!timeslotHoursPromise) {
    timeslotHoursPromise = prisma.timeslot
      .findMany({
        select: { startTime: true },
        orderBy: { startTime: "asc" },
      })
      .then((rows) =>
        [...new Set(rows.map(({ startTime }) => hourOf(startTime)))]
          .filter(inClinicHours)
          .sort((a, b) => a - b),
      )
      .catch((error) => {
        timeslotHoursPromise = null; // do not cache a failure
        throw error;
      });
  }
  return timeslotHoursPromise;
};

// ---------- Vets ----------
export const findSuggestionVets = async () => {
  const vets = await prisma.veterinarian.findMany({
    where: { isDeleted: false },
    select: { vetId: true },
    orderBy: { vetId: "asc" },
  });
  return vets.map(({ vetId }) => vetId);
};

// ---------- Booked slots in the search window ----------
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
          gte: toUtcMidnight(fromDate),
          lte: toUtcMidnight(toDate),
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
    hours,
    occupied, // Set of slotKey strings
    blocked: new Set(), // no blocked-periods table yet: leave days and closures are NOT respected
  };
};

// Throws if any query fails. The route must turn that into an error response,
// never into an empty schedule (an empty schedule would make every slot look free).
export const loadSchedule = async ({ fromDate, toDate }) => {
  const vetIds = await findSuggestionVets();
  return findSuggestionSchedule({ fromDate, toDate, vetIds });
};