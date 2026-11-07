import { prisma } from "../config/prisma.js";
import { findBookedTimeslotIds } from "../models/appointmentModel.js";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const parseScheduledDate = (scheduledDate) => {
  if (
    typeof scheduledDate !== "string" ||
    !DATE_PATTERN.test(scheduledDate)
  ) {
    throw new Error("scheduledDate must use the YYYY-MM-DD format");
  }

  const date = new Date(`${scheduledDate}T00:00:00.000Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== scheduledDate
  ) {
    throw new Error("scheduledDate must be a valid calendar date");
  }

  return date;
};

const parseVetId = (vetId) => {
  if (vetId === undefined || vetId === null || vetId === "") {
    return undefined;
  }

  const parsedVetId = Number(vetId);
  if (!Number.isInteger(parsedVetId) || parsedVetId <= 0) {
    throw new Error("vetId must be a positive integer");
  }

  return parsedVetId;
};

export const getAvailability = async ({ scheduledDate, vetId } = {}) => {
  const date = parseScheduledDate(scheduledDate);
  const parsedVetId = parseVetId(vetId);
  const [timeslots, appointments, veterinarianCount] = await Promise.all([
    prisma.timeslot.findMany({
      select: {
        timeslotId: true,
        startTime: true,
        endTime: true,
        display: true,
      },
      orderBy: {
        startTime: "asc",
      },
    }),
    findBookedTimeslotIds({
      scheduledDate: date,
      vetId: parsedVetId,
    }),
    parsedVetId === undefined
      ? prisma.veterinarian.count({ where: { isDeleted: false } })
      : Promise.resolve(1),
  ]);

  let bookedTimeslotIds;
  if (parsedVetId === undefined && veterinarianCount > 0) {
    const bookedVetsByTimeslot = new Map();
    for (const appointment of appointments) {
      const vets = bookedVetsByTimeslot.get(appointment.timeslotId) ?? new Set();
      vets.add(appointment.vetId);
      bookedVetsByTimeslot.set(appointment.timeslotId, vets);
    }
    bookedTimeslotIds = new Set(
      [...bookedVetsByTimeslot.entries()]
        .filter(([, vets]) => vets.size >= veterinarianCount)
        .map(([timeslotId]) => timeslotId),
    );
  } else {
    bookedTimeslotIds = new Set(
      appointments.map(({ timeslotId }) => timeslotId),
    );
  }

  return timeslots.map((timeslot) => ({
    ...timeslot,
    isBooked: bookedTimeslotIds.has(timeslot.timeslotId),
  }));
};
