export const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
export const defaultWeekStart = new Date(2026, 10, 2);

export const createInitialSchedules = () => [
  {
    vetId: "sofia",
    name: "Dr. Sofia Reyes",
    specialty: "General practice",
    shifts: Array.from({ length: 5 }, () => ({
      start: "8:00 AM",
      end: "5:00 PM",
      breakStart: "12:00 PM",
      breakEnd: "1:00 PM",
    })),
  },
  {
    vetId: "miguel",
    name: "Dr. Miguel Santos",
    specialty: "Surgery & diagnostics",
    shifts: [
      { start: "8:00 AM", end: "5:00 PM", breakStart: "12:00 PM", breakEnd: "1:00 PM" },
      { start: "8:00 AM", end: "5:00 PM", breakStart: "12:00 PM", breakEnd: "1:00 PM" },
      { start: "8:00 AM", end: "5:00 PM", breakStart: "12:00 PM", breakEnd: "1:00 PM" },
      { start: "8:00 AM", end: "12:00 PM", timeOff: "1:00 PM–5:00 PM" },
      { start: "8:00 AM", end: "5:00 PM", breakStart: "12:00 PM", breakEnd: "1:00 PM" },
    ],
  },
  {
    vetId: "ana",
    name: "Dr. Ana Cruz",
    specialty: "Preventive care",
    shifts: Array.from({ length: 5 }, () => ({
      start: "10:00 AM",
      end: "6:00 PM",
      breakStart: "12:00 PM",
      breakEnd: "1:00 PM",
    })),
  },
];

export const createInitialTimeOff = () => [
  { id: 1, veterinarian: "Dr. Miguel Santos", date: new Date(2026, 10, 5), time: "1:00–5:00 PM", reason: "Personal leave", status: "Approved" },
  { id: 2, veterinarian: "Dr. Ana Cruz", date: new Date(2026, 10, 12), time: "All day", reason: "Training", status: "Approved" },
  { id: 3, veterinarian: "Dr. Sofia Reyes", date: new Date(2026, 10, 18), time: "8:00 AM–12:00 PM", reason: "Personal leave", status: "Pending" },
];

export const createEmptyTimeOffDraft = () => ({
  veterinarian: "",
  date: "",
  allDay: false,
  startTime: "",
  endTime: "",
  reason: "",
  notes: "",
});

export const startOfWeek = (date) => {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = result.getDay();
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  return result;
};

export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const formatDate = (date, options = { month: "short", day: "numeric" }) =>
  date.toLocaleDateString("en-US", options);

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

export const createScheduleDraft = (vetId, start, end, days = [0, 1, 2, 3, 4]) => ({
  vetId,
  startDate: toDateInput(start),
  endDate: toDateInput(end),
  days,
  startTime: "8:00 AM",
  endTime: "5:00 PM",
  breakStart: "12:00 PM",
  breakEnd: "1:00 PM",
  location: "Main clinic",
  notes: "",
});
