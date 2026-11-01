import {
  createPendingAppointment,
  findAppointmentById,
  findFirstAvailableVeterinarian,
  findOwnerPet,
  updateAppointmentSchedule,
} from "../models/appointmentModel.js";
import { findCustomerByAccount } from "../models/customerModel.js";
import { emitAppointmentChanged } from "../realtime.js";

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
  vetId,
}) => {
  const parsedAppointmentId = parsePositiveInteger(
    appointmentId,
    "Invalid appointment id.",
  );
  const parsedTimeslotId = parsePositiveInteger(
    timeslotId,
    "Invalid time slot.",
  );
  const parsedVetId = parseOptionalPositiveInteger(
    vetId,
    "Invalid veterinarian.",
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

  await updateAppointmentSchedule({
    appointmentId: parsedAppointmentId,
    scheduledDate: parsedScheduledDate,
    timeslotId: parsedTimeslotId,
    vetId: parsedVetId,
  });

  emitAppointmentChanged(appointment.pet.owner.accountId, {
    type: "rescheduled",
    appointmentId,
  });

  return appointment;
};