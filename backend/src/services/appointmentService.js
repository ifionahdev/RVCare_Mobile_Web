import {
  createPendingAppointment,
  findAppointmentById,
  findRecentPendingAppointments,
  updateAppointmentSchedule,
  cancelAppointment as cancelAppointmentRecord,
  findBookedTimeslotIds,
  findTimeslotById,
  findTodaysUpcomingAppointments,
} from "../models/appointmentModel.js";
import { findOwnerPet } from "../models/petModel.js";
import { findFirstAvailableVeterinarian } from "../models/vetModel.js";
import { findCustomerByAccount } from "../models/customerModel.js";
import { emitAppointmentChanged } from "../realtime.js";
import { BOOKING_DAYS } from "../scheduling/ctr.js";
import {
  appointmentStartDateTime,
  isCancellationAllowed,
  isRescheduleAllowed,
  isWithinBookingWindow,
} from "./appointmentPolicy.js";

export class AppointmentServiceError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = "AppointmentServiceError";
    this.statusCode = statusCode;
  }
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const parsePositiveInteger = (value, message) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppointmentServiceError(message, 400);
  }

  return parsed;
};

const parseOptionalPositiveInteger = (value, message) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return parsePositiveInteger(value, message);
};

const parseDate = (value, message) => {
  if (
    typeof value !== "string" ||
    !DATE_PATTERN.test(value) ||
    Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()) ||
    new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) !== value
  ) {
    throw new AppointmentServiceError(message, 400);
  }

  return new Date(`${value}T00:00:00.000Z`);
};

const requireOwner = async (appointmentId, accountId) => {
  const appointment = await findAppointmentById(appointmentId);
  if (!appointment || appointment.pet.owner.accountId !== accountId) {
    return null;
  }

  return appointment;
};

export const createAppointment = async ({
  accountId,
  petId,
  serviceId,
  vetId,
  scheduledDate,
  timeslotId,
}) => {
  const parsedPetId = parsePositiveInteger(petId, "Invalid appointment details.");
  const parsedServiceId = parsePositiveInteger(
    serviceId,
    "Invalid appointment details.",
  );
  const parsedTimeslotId = parsePositiveInteger(
    timeslotId,
    "Invalid appointment details.",
  );
  const parsedVetId = parseOptionalPositiveInteger(
    vetId,
    "Invalid appointment details.",
  );
  const parsedScheduledDate = parseDate(
    scheduledDate,
    "Invalid appointment details.",
  );
  const owner = await findCustomerByAccount(accountId);
  const pet = owner ? await findOwnerPet(parsedPetId, owner.ownerId) : null;

  if (!pet) {
    throw new AppointmentServiceError(
      "You can only book for your own pets.",
      403,
    );
  }

  const selectedVetId =
    parsedVetId ??
    (await findFirstAvailableVeterinarian())?.vetId;

  if (!selectedVetId) {
    throw new AppointmentServiceError("No veterinarian is available.", 400);
  }

  const appointment = await createPendingAppointment({
    petId: parsedPetId,
    serviceId: parsedServiceId,
    vetId: selectedVetId,
    scheduledDate: parsedScheduledDate,
    timeslotId: parsedTimeslotId,
    accountId,
  });

  emitAppointmentChanged(accountId, {
    type: "created",
    appointmentId: appointment.appointmentId,
  });

  return appointment;
};

export const getAppointment = (appointmentId, { accountId, role }) => {
  const parsedAppointmentId = parsePositiveInteger(
    appointmentId,
    "Invalid appointment id.",
  );

  return role === "admin"
    ? findAppointmentById(parsedAppointmentId)
    : requireOwner(parsedAppointmentId, accountId);
};

export const rescheduleOwnerAppointment = async ({
  appointmentId,
  accountId,
  role,
  scheduledDate,
  timeslotId,
}) => {
  const parsedAppointmentId = parsePositiveInteger(
    appointmentId,
    "Invalid appointment id.",
  );
  const parsedTimeslotId = parsePositiveInteger(
    timeslotId,
    "Invalid time slot.",
  );
  const parsedScheduledDate = parseDate(
    scheduledDate,
    "Invalid scheduled date.",
  );
  const appointment = await getAppointment(parsedAppointmentId, {
    accountId,
    role,
  });
  if (!appointment) {
    return null;
  }

  const now = new Date();
  if (!isRescheduleAllowed(appointment, now)) {
    throw new AppointmentServiceError(
      "Appointments can only be rescheduled at least 24 hours before the visit.",
      409,
    );
  }
  const scheduledDateValue = parsedScheduledDate.toISOString().slice(0, 10);
  if (!isWithinBookingWindow(scheduledDateValue, now, BOOKING_DAYS)) {
    throw new AppointmentServiceError(
      "Choose a date within the available booking window.",
      400,
    );
  }
  const timeslot = await findTimeslotById(parsedTimeslotId);
  if (!timeslot) {
    throw new AppointmentServiceError("Invalid time slot.", 400);
  }
  const targetAppointment = {
    scheduledDate: parsedScheduledDate,
    timeslot,
  };
  if (appointmentStartDateTime(targetAppointment) <= now) {
    throw new AppointmentServiceError("Choose a future time slot.", 400);
  }
  const bookedTimeslots = await findBookedTimeslotIds({
    scheduledDate: parsedScheduledDate,
    vetId: appointment.vetId,
    excludeAppointmentId: parsedAppointmentId,
  });
  if (bookedTimeslots.some((booked) => booked.timeslotId === parsedTimeslotId)) {
    throw new AppointmentServiceError(
      "That time slot is no longer available for your veterinarian.",
      409,
    );
  }

  await updateAppointmentSchedule({
    appointmentId: parsedAppointmentId,
    scheduledDate: parsedScheduledDate,
    timeslotId: parsedTimeslotId,
    accountId,
  });

  emitAppointmentChanged(appointment.pet.owner.accountId, {
    type: "rescheduled",
    appointmentId,
  });

  return appointment;
};

export const cancelOwnerAppointment = async ({
  appointmentId,
  accountId,
  role,
}) => {
  const parsedAppointmentId = parsePositiveInteger(
    appointmentId,
    "Invalid appointment id.",
  );
  const appointment = await getAppointment(parsedAppointmentId, {
    accountId,
    role,
  });
  if (!appointment) return null;

  if (!isCancellationAllowed(appointment)) {
    throw new AppointmentServiceError(
      appointment.status === "Upcoming"
        ? "Confirmed appointments cannot be cancelled within 3 days of the visit."
        : "This appointment can no longer be cancelled.",
      409,
    );
  }

  await cancelAppointmentRecord({
    appointmentId: parsedAppointmentId,
    accountId,
  });
  emitAppointmentChanged(appointment.pet.owner.accountId, {
    type: "cancelled",
    appointmentId: parsedAppointmentId,
  });

  return appointment;
};

const toTodayAppointmentDto = (a) => ({
  id: a.appointmentId,
  timeslot: a.timeslot.display,
  petName: a.pet.petName,
  service: a.service.serviceName,
  vetName: a.veterinarian?.account
    ? `Dr. ${a.veterinarian.account.firstName} ${a.veterinarian.account.lastName}`
    : "Veterinarian not assigned",
});

export const getTodaysUpcomingAppointments = async () => {
  const appointments = await findTodaysUpcomingAppointments();
  return appointments.map(toTodayAppointmentDto);
}

const toPendingAppointmentDto = (a) => ({
  id: a.appointmentId,
  scheduledDate: a.scheduledDate.toISOString().slice(0, 10),
    timeslot: a.timeslot.display,
    petName: a.pet.petName,
    service: a.service.serviceName,
    vetName: `Dr. ${a.veterinarian.account.firstName} ${a.veterinarian.account.lastName}`,
});

export const getRecentPendingAppointments = async () => {
  const appointments = await findRecentPendingAppointments();
  return appointments.map(toTodayAppointmentDto);
}