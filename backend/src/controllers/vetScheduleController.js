import {
  createVeterinarianSchedules,
  createVeterinarianTimeOff,
  findActiveVeterinarian,
  findActiveVeterinarianSchedule,
  findActiveVeterinarianScheduleForDay,
  findActiveVeterinarianTimeOff,
  findScheduleConflict,
  findVeterinarianScheduleTimeOptions,
  findVeterinarianSchedules,
  findVeterinarianTimeOff,
  softDeleteVeterinarianSchedule,
  softDeleteVeterinarianTimeOff,
  updateVeterinarianScheduleRecord,
  updateVeterinarianTimeOff,
} from "../models/vetScheduleModel.js";

const DAYS_PER_WEEK = 7;
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_OFF_STATUSES = new Set(["Pending", "Approved", "Rejected"]);

const positiveInteger = (value) => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

const dateOnly = (value) => {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value
    ? null
    : parsed;
};

const veterinarianName = (row) => {
  const account = row.veterinarian.account;
  return `Dr. ${account.firstName} ${account.lastName}`;
};

const scheduleDto = (row) => ({
  scheduleId: row.scheduleId,
  vetId: row.vetId,
  dayOfWeek: row.dayOfWeek,
  startTime: row.startTime,
  endTime: row.endTime,
  note: row.note,
  veterinarian: veterinarianName(row),
});

const timeOffDto = (row) => ({
  timeOffId: row.timeOffId,
  vetId: row.vetId,
  veterinarian: veterinarianName(row),
  date: row.date.toISOString().slice(0, 10),
  startTime: row.startTime,
  endTime: row.endTime,
  reason: row.reason,
  note: row.note,
  status: row.status,
});

const badRequest = (res, message) => res.status(400).json({ message });
const notFound = (res, message) => res.status(404).json({ message });
const conflict = (res, message) => res.status(409).json({ message });
const scheduleConflictMessage = (vet, dayOfWeek) =>
  `${DAY_NAMES[dayOfWeek - 1]} already has a schedule for Dr. ${vet.account.firstName} ${vet.account.lastName}.`;
const timeOffScheduleMessage = (vet, dayOfWeek) =>
  `Dr. ${vet.account.firstName} ${vet.account.lastName} does not have a schedule on ${DAY_NAMES[dayOfWeek - 1]}. Time off can only be filed on a scheduled day.`;
const dayOfWeekForDate = (date) => date.getUTCDay() || DAYS_PER_WEEK;

const readScheduleFields = (body) => {
  const vetId = positiveInteger(body.vetId);
  const startTime = body.startTime;
  const endTime = body.endTime;
  const note = body.note ?? "";

  if (!vetId) return { error: "Select a valid veterinarian." };
  if (
    typeof startTime !== "string" ||
    !TIME_PATTERN.test(startTime) ||
    typeof endTime !== "string" ||
    !TIME_PATTERN.test(endTime) ||
    startTime >= endTime
  ) {
    return { error: "Enter a valid start and end time." };
  }
  if (typeof note !== "string" || note.length > 255) {
    return { error: "Notes must be 255 characters or fewer." };
  }

  return {
    data: {
      vetId,
      startTime,
      endTime,
      note: note.trim() || null,
    },
  };
};

const readTimeOffFields = (body, currentStatus = "Pending") => {
  const vetId = positiveInteger(body.vetId);
  const date = dateOnly(body.date);
  const reason = body.reason;
  const note = body.note ?? "";
  const startTime =
    body.startTime === undefined || body.startTime === null || body.startTime === ""
      ? null
      : body.startTime;
  const endTime =
    body.endTime === undefined || body.endTime === null || body.endTime === ""
      ? null
      : body.endTime;
  const status = body.status ?? currentStatus;

  if (!vetId) return { error: "Select a valid veterinarian." };
  if (!date) return { error: "Enter a valid date." };
  if (typeof reason !== "string" || !reason.trim() || reason.length > 255) {
    return { error: "Enter a reason of 255 characters or fewer." };
  }
  if (typeof note !== "string" || note.length > 255) {
    return { error: "Notes must be 255 characters or fewer." };
  }
  if (
    (startTime === null) !== (endTime === null) ||
    (startTime !== null &&
      (typeof startTime !== "string" ||
        !TIME_PATTERN.test(startTime) ||
        typeof endTime !== "string" ||
        !TIME_PATTERN.test(endTime) ||
        startTime >= endTime))
  ) {
    return { error: "Enter a valid time range or select all day." };
  }
  if (!TIME_OFF_STATUSES.has(status)) {
    return { error: "Select a valid time-off status." };
  }

  return {
    data: {
      vetId,
      date,
      startTime,
      endTime,
      reason: reason.trim(),
      note: note.trim() || null,
      status,
    },
  };
};

const isStoredTimeRange = async (startTime, endTime) => {
  const slots = await findVeterinarianScheduleTimeOptions();
  return (
    slots.some((slot) => slot.startTime === startTime) &&
    slots.some((slot) => slot.endTime === endTime)
  );
};

const todayInManila = () =>
  new Date(
    `${new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" })}T00:00:00.000Z`,
  );

export const getVeterinarianScheduleTimeOptions = async (req, res, next) => {
  try {
    const slots = await findVeterinarianScheduleTimeOptions();
    return res.json({
      startTimes: [...new Set(slots.map((slot) => slot.startTime))],
      endTimes: [...new Set(slots.map((slot) => slot.endTime))],
    });
  } catch (error) {
    return next(error);
  }
};

export const getVeterinarianSchedules = async (req, res, next) => {
  try {
    const schedules = await findVeterinarianSchedules();
    return res.json(schedules.map(scheduleDto));
  } catch (error) {
    return next(error);
  }
};

export const createVeterinarianSchedule = async (req, res, next) => {
  try {
    const body = req.body ?? {};
    const fields = readScheduleFields(body);
    if (fields.error) return badRequest(res, fields.error);
    if (!(await isStoredTimeRange(fields.data.startTime, fields.data.endTime))) {
      return badRequest(res, "Choose start and end times from the available time slots.");
    }

    const days = body.days;
    if (
      !Array.isArray(days) ||
      days.length === 0 ||
      days.some((day) => !Number.isInteger(day) || day < 1 || day > DAYS_PER_WEEK)
    ) {
      return badRequest(res, "Select at least one weekday.");
    }

    const uniqueDays = [...new Set(days)];
    const veterinarian = await findActiveVeterinarian(fields.data.vetId);
    if (!veterinarian) {
      return notFound(res, "Veterinarian not found.");
    }

    for (const dayOfWeek of uniqueDays) {
      if (await findScheduleConflict({ vetId: fields.data.vetId, dayOfWeek })) {
        return conflict(res, scheduleConflictMessage(veterinarian, dayOfWeek));
      }
    }

    const schedules = await createVeterinarianSchedules(
      uniqueDays.map((dayOfWeek) => ({
        ...fields.data,
        dayOfWeek,
        assignerId: req.user.accountId,
      })),
    );
    return res.status(201).json(schedules.map(scheduleDto));
  } catch (error) {
    return next(error);
  }
};

export const updateVeterinarianSchedule = async (req, res, next) => {
  try {
    const body = req.body ?? {};
    const scheduleId = positiveInteger(req.params.scheduleId);
    if (!scheduleId) return badRequest(res, "Invalid schedule ID.");

    const existing = await findActiveVeterinarianSchedule(scheduleId);
    if (!existing) return notFound(res, "Schedule not found.");

    const fields = readScheduleFields(body);
    if (fields.error) return badRequest(res, fields.error);
    if (!(await isStoredTimeRange(fields.data.startTime, fields.data.endTime))) {
      return badRequest(res, "Choose start and end times from the available time slots.");
    }
    const dayOfWeek = body.dayOfWeek;
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > DAYS_PER_WEEK) {
      return badRequest(res, "Select a valid weekday.");
    }
    const veterinarian = await findActiveVeterinarian(fields.data.vetId);
    if (!veterinarian) {
      return notFound(res, "Veterinarian not found.");
    }
    if (
      await findScheduleConflict({
        vetId: fields.data.vetId,
        dayOfWeek,
        exceptScheduleId: scheduleId,
      })
    ) {
      return conflict(res, scheduleConflictMessage(veterinarian, dayOfWeek));
    }

    const schedule = await updateVeterinarianScheduleRecord(scheduleId, {
      ...fields.data,
      dayOfWeek,
    }, req.user.accountId);
    return res.json(scheduleDto(schedule));
  } catch (error) {
    return next(error);
  }
};

export const deleteVeterinarianSchedule = async (req, res, next) => {
  try {
    const scheduleId = positiveInteger(req.params.scheduleId);
    if (!scheduleId) return badRequest(res, "Invalid schedule ID.");
    if (!(await findActiveVeterinarianSchedule(scheduleId))) {
      return notFound(res, "Schedule not found.");
    }

    await softDeleteVeterinarianSchedule(scheduleId, req.user.accountId);
    return res.json({ message: "Veterinarian schedule deleted." });
  } catch (error) {
    return next(error);
  }
};

export const getVeterinarianTimeOff = async (req, res, next) => {
  try {
    const timeOff = await findVeterinarianTimeOff();
    return res.json(timeOff.map(timeOffDto));
  } catch (error) {
    return next(error);
  }
};

export const createVeterinarianTimeOffEntry = async (req, res, next) => {
  try {
    const fields = readTimeOffFields(req.body ?? {});
    if (fields.error) return badRequest(res, fields.error);
    if (
      fields.data.startTime &&
      !(await isStoredTimeRange(fields.data.startTime, fields.data.endTime))
    ) {
      return badRequest(res, "Choose start and end times from the available time slots.");
    }
    if (fields.data.date < todayInManila()) {
      return badRequest(res, "Time off cannot be scheduled for a past date.");
    }
    const veterinarian = await findActiveVeterinarian(fields.data.vetId);
    if (!veterinarian) {
      return notFound(res, "Veterinarian not found.");
    }
    const dayOfWeek = dayOfWeekForDate(fields.data.date);
    if (!(await findActiveVeterinarianScheduleForDay(fields.data.vetId, dayOfWeek))) {
      return badRequest(res, timeOffScheduleMessage(veterinarian, dayOfWeek));
    }

    const timeOff = await createVeterinarianTimeOff({
      ...fields.data,
      status: "Pending",
      reviewerId: req.user.accountId,
    });
    return res.status(201).json(timeOffDto(timeOff));
  } catch (error) {
    return next(error);
  }
};

export const updateVeterinarianTimeOffEntry = async (req, res, next) => {
  try {
    const timeOffId = positiveInteger(req.params.timeOffId);
    if (!timeOffId) return badRequest(res, "Invalid time-off ID.");

    const existing = await findActiveVeterinarianTimeOff(timeOffId);
    if (!existing) return notFound(res, "Time off not found.");

    const fields = readTimeOffFields(req.body ?? {});
    if (fields.error) return badRequest(res, fields.error);
    if (
      fields.data.startTime &&
      !(await isStoredTimeRange(fields.data.startTime, fields.data.endTime))
    ) {
      return badRequest(res, "Choose start and end times from the available time slots.");
    }
    if (fields.data.date < todayInManila()) {
      return badRequest(res, "Time off cannot be scheduled for a past date.");
    }
    const veterinarian = await findActiveVeterinarian(fields.data.vetId);
    if (!veterinarian) {
      return notFound(res, "Veterinarian not found.");
    }
    const dayOfWeek = dayOfWeekForDate(fields.data.date);
    if (!(await findActiveVeterinarianScheduleForDay(fields.data.vetId, dayOfWeek))) {
      return badRequest(res, timeOffScheduleMessage(veterinarian, dayOfWeek));
    }

    const timeOff = await updateVeterinarianTimeOff(timeOffId, {
      ...fields.data,
      reviewerId: req.user.accountId,
      reviewedAt: new Date(),
    });
    return res.json(timeOffDto(timeOff));
  } catch (error) {
    return next(error);
  }
};

export const deleteVeterinarianTimeOffEntry = async (req, res, next) => {
  try {
    const timeOffId = positiveInteger(req.params.timeOffId);
    if (!timeOffId) return badRequest(res, "Invalid time-off ID.");
    if (!(await findActiveVeterinarianTimeOff(timeOffId))) {
      return notFound(res, "Time off not found.");
    }

    await softDeleteVeterinarianTimeOff(timeOffId, req.user.accountId);
    return res.json({ message: "Time off deleted." });
  } catch (error) {
    return next(error);
  }
};
