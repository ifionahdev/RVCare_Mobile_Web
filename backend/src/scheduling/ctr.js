const HOURS_START = 8;
const HOURS_END = 20;
const SLOTS_PER_DAY = HOURS_END - HOURS_START;
const K = 3;
const HALF_WINDOW = 7;
const BOOKING_DAYS = 90;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):00$/;

const dayNum = (value) =>
  Date.UTC(
    Number(value.slice(0, 4)),
    Number(value.slice(5, 7)) - 1,
    Number(value.slice(8, 10)),
  ) / 86_400_000;

const dayStr = (value) =>
  new Date(value * 86_400_000).toISOString().slice(0, 10);

const absMin = (day, hour) => day * 1_440 + hour * 60;
const slotKey = (vetId, date, hour) => `${vetId}|${date}|${hour}`;

const isValidDate = (value) => {
  if (!DATE_PATTERN.test(value ?? "")) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const parseHour = (value) => {
  if (typeof value !== "string" || !TIME_PATTERN.test(value)) return null;
  const hour = Number(value.slice(0, 2));
  return hour >= HOURS_START && hour < HOURS_END ? hour : null;
};

export const validateRequest = (request, vetIds, now) => {
  if (!isValidDate(request.date)) return "INVALID_DATE";
  if (request.hour === null || request.hour === undefined) return "INVALID_TIME";

  const today = dayNum(now.date);
  const requestedDay = dayNum(request.date);
  if (
    requestedDay < today ||
    requestedDay > today + BOOKING_DAYS
  ) {
    return "OUTSIDE_BOOKING_WINDOW";
  }

  if (
    request.vet !== "Any" &&
    (!Number.isInteger(request.vet) || !vetIds.includes(request.vet))
  ) {
    return "INVALID_VET";
  }

  return null;
};

export const parseRequestedHour = parseHour;

export const windowDates = (request, now) => {
  const requestedDay = dayNum(request.date);
  const today = dayNum(now.date);
  return {
    lo: dayStr(Math.max(requestedDay - HALF_WINDOW, today)),
    hi: dayStr(
      Math.min(requestedDay + HALF_WINDOW, today + BOOKING_DAYS),
    ),
  };
};

const isTaken = (schedule, vetId, date, hour) => {
  const key = slotKey(vetId, date, hour);
  return schedule.occupied.has(key) || schedule.blocked.has(key);
};

export const preferredIsFree = (request, schedule, now) => {
  const nowAbs = dayNum(now.date) * 1_440 + now.minutes;
  if (absMin(dayNum(request.date), request.hour) < nowAbs) return false;

  const vets = request.vet === "Any" ? schedule.vets : [request.vet];
  return vets.some((vetId) => !isTaken(schedule, vetId, request.date, request.hour));
};

const workloadOf = (schedule, vetId, date) => {
  const hours = schedule.hours ?? Array.from(
    { length: SLOTS_PER_DAY },
    (_, index) => HOURS_START + index,
  );
  let occupied = 0;
  for (const hour of hours) {
    if (schedule.occupied.has(slotKey(vetId, date, hour))) occupied++;
  }
  return hours.length === 0 ? 0 : occupied / hours.length;
};

const describe = (candidate) => {
  const when = candidate.sameDay
    ? "Same day"
    : `${candidate.dayGap} day(s) from requested date`;
  const relation =
    candidate.dist === 0
      ? "at requested time"
      : `${candidate.dist} h ${candidate.before ? "before" : "after"} requested time`;
  return `${when}, ${relation}`;
};

export const recommend = (request, schedule, now) => {
  const requestedDay = dayNum(request.date);
  const today = dayNum(now.date);
  const nowAbs = today * 1_440 + now.minutes;
  const requestedAbs = absMin(requestedDay, request.hour);
  const lower = Math.max(requestedDay - HALF_WINDOW, today);
  const upper = Math.min(requestedDay + HALF_WINDOW, today + BOOKING_DAYS);
  const vets = request.vet === "Any" ? schedule.vets : [request.vet];
  const hours = schedule.hours ?? Array.from(
    { length: SLOTS_PER_DAY },
    (_, index) => HOURS_START + index,
  );

  const days = [];
  for (let day = lower; day <= upper; day++) days.push(day);
  days.sort(
    (a, b) => Math.abs(a - requestedDay) - Math.abs(b - requestedDay) || a - b,
  );

  for (const day of days) {
    const date = dayStr(day);
    const candidates = [];

    for (const hour of hours) {
      if (absMin(day, hour) < nowAbs) continue;

      for (const vetId of vets) {
        if (isTaken(schedule, vetId, date, hour)) continue;
        candidates.push({
          vetId,
          date,
          hour,
          workload: workloadOf(schedule, vetId, date),
        });
      }
    }

    if (candidates.length === 0) continue;

    const byHour = new Map();
    for (const candidate of candidates) {
      const current = byHour.get(candidate.hour);
      if (
        !current ||
        candidate.workload < current.workload ||
        (candidate.workload === current.workload &&
          candidate.vetId < current.vetId)
      ) {
        byHour.set(candidate.hour, candidate);
      }
    }

    return [...byHour.values()]
      .map((candidate) => {
        const difference = absMin(day, candidate.hour) - requestedAbs;
        return {
          ...candidate,
          dist: Math.abs(difference) / 60,
          before: difference < 0,
          sameDay: day === requestedDay,
          dayGap: Math.abs(day - requestedDay),
        };
      })
      .sort(
        (a, b) =>
          a.dist - b.dist ||
          a.hour - b.hour ||
          a.workload - b.workload ||
          a.vetId - b.vetId,
      )
      .slice(0, K)
      .map((candidate) => ({
        veterinarian_id: candidate.vetId,
        date: candidate.date,
        start_time: `${String(candidate.hour).padStart(2, "0")}:00`,
        end_time: `${String(candidate.hour + 1).padStart(2, "0")}:00`,
        reason: describe(candidate),
      }));
  }

  return [];
};

export { HOURS_START, HOURS_END, BOOKING_DAYS, HALF_WINDOW, K, slotKey };
