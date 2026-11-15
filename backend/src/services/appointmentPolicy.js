const ACTIVE_STATUSES = new Set(["pending", "upcoming"]);
const APPROVED_STATUSES = new Set(["upcoming", "approved", "confirmed", "incoming"]);
const HOUR_MS = 60 * 60 * 1000;

export const appointmentStartDateTime = (appointment) => {
  const date =
    appointment.scheduledDate instanceof Date
      ? appointment.scheduledDate.toISOString().slice(0, 10)
      : appointment.scheduledDate;
  const startTime = appointment.timeslot?.startTime;
  if (
    typeof date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    typeof startTime !== "string" ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)
  ) {
    throw new TypeError("Appointment date or start time is invalid.");
  }

  return new Date(`${date}T${startTime}:00+08:00`);
};

const isActive = (appointment) =>
  ACTIVE_STATUSES.has(appointment.status?.toLowerCase());

export const isRescheduleAllowed = (appointment, now = new Date()) =>
  isActive(appointment) &&
  appointmentStartDateTime(appointment).getTime() - now.getTime() >=
    24 * HOUR_MS;

export const isCancellationAllowed = (appointment, now = new Date()) => {
  if (!isActive(appointment)) return false;

  const hoursUntil =
    (appointmentStartDateTime(appointment).getTime() - now.getTime()) /
    HOUR_MS;
  if (hoursUntil <= 0) return false;

  return (
    !APPROVED_STATUSES.has(appointment.status.toLowerCase()) ||
    hoursUntil >= 72
  );
};

export const isWithinBookingWindow = (
  scheduledDate,
  now = new Date(),
  bookingDays = 90,
) => {
  const manilaParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type) => manilaParts.find((item) => item.type === type).value;
  const today = `${part("year")}-${part("month")}-${part("day")}`;
  const dayNumber = (value) =>
    Date.UTC(
      Number(value.slice(0, 4)),
      Number(value.slice(5, 7)) - 1,
      Number(value.slice(8, 10)),
    ) / 86_400_000;

  const offset = dayNumber(scheduledDate) - dayNumber(today);
  return offset >= 0 && offset <= bookingDays;
};
