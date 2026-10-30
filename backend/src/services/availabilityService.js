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
  const [timeslots, appointments] = await Promise.all([
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
  ]);

  const bookedTimeslotIds = new Set(
    appointments.map(({ timeslotId }) => timeslotId),
  );

  return timeslots.map((timeslot) => ({
    ...timeslot,
    isBooked: bookedTimeslotIds.has(timeslot.timeslotId),
  }));
};
