export const weekdays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const startOfWeek = (date) => {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = result.getDay();
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  return result;
};

export const defaultWeekStart = startOfWeek(new Date());

export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const formatDate = (value, options = { month: "short", day: "numeric" }) => {
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-US", options);
};

export const formatWeekLabel = (start, end) => {
  const startLabel = formatDate(start, { month: "long", day: "numeric" });
  const endLabel = start.getMonth() === end.getMonth()
    ? formatDate(end, { day: "numeric" })
    : formatDate(end, { month: "long", day: "numeric" });
  return `${startLabel} – ${endLabel}, ${end.getFullYear()}`;
};

export const toDateInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const todayInManilaDate = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
};

export const formatTime = (value) => {
  if (!value) return "";
  const [hours, minutes] = value.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${suffix}`;
};

export const createEmptyTimeOffDraft = () => ({
  timeOffId: null,
  vetId: "",
  date: "",
  allDay: true,
  startTime: "",
  endTime: "",
  reason: "",
  notes: "",
  status: "Pending",
});

export const createScheduleDraft = (vetId = "", days = [1, 2, 3, 4, 5]) => ({
  scheduleId: null,
  vetId: String(vetId),
  days,
  startTime: "08:00",
  endTime: "17:00",
  note: "",
});

export const groupSchedulesByVeterinarian = (vets, schedules, timeOff, weekDays) =>
  vets.map((vet) => ({
    vetId: String(vet.vetId),
    name: vet.name,
    shifts: weekdays.map((_, index) => {
      const dayOfWeek = index + 1;
      const schedule = schedules.find(
        (item) => item.vetId === vet.vetId && item.dayOfWeek === dayOfWeek,
      );
      const date = toDateInput(weekDays[index]);
      const dayTimeOff = timeOff.filter(
        (item) =>
          Number(item.vetId) === Number(vet.vetId) &&
          (item.date instanceof Date
            ? toDateInput(item.date)
            : String(item.date ?? "").slice(0, 10)) === date &&
          item.status !== "Rejected",
      );

      return {
        scheduleId: schedule?.scheduleId ?? null,
        start: schedule ? formatTime(schedule.startTime) : "",
        end: schedule ? formatTime(schedule.endTime) : "",
        note: schedule?.note ?? "",
        timeOff: dayTimeOff.map((item) => ({
          timeOffId: item.timeOffId,
          reason: item.reason || "Leave",
          status: item.status,
          hours: item.startTime
            ? `${formatTime(item.startTime)}–${formatTime(item.endTime)}`
            : "All day",
        })),
      };
    }),
  }));
