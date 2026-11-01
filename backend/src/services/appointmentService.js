import {
  createPendingAppointment,
  findAllAppointments,
  findAppointmentById,
  findFirstAvailableVeterinarian,
  findOwnerPet,
  findOwnerAppointments,
  getPendingAppointmentsCount as countPendingAppointments,
  getTodaysPendingAppointmentsCount as countTodaysPendingAppointments,
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
  const owner = await findCustomerByAccount(accountId);
  const pet = owner ? await findOwnerPet(petId, owner.ownerId) : null;

  if (!pet) {
    throw new AppointmentServiceError(
      "You can only book for your own pets.",
      403,
    );
  }

  const selectedVetId =
    vetId ??
    (await findFirstAvailableVeterinarian())?.vetId;

  if (!selectedVetId) {
    throw new AppointmentServiceError("No veterinarian is available.", 400);
  }

  const appointment = await createPendingAppointment({
    petId,
    serviceId,
    vetId: selectedVetId,
    scheduledDate: new Date(`${scheduledDate}T00:00:00.000Z`),
    timeslotId,
  });

  emitAppointmentChanged(accountId, {
    type: "created",
    appointmentId: appointment.appointmentId,
  });

  return appointment;
};

export const getOwnerAppointments = (accountId) =>
  findOwnerAppointments(accountId);

export const getAllAppointments = () => findAllAppointments();

export const getAppointment = (appointmentId, { accountId, role }) =>
  role === "admin"
    ? findAppointmentById(appointmentId)
    : requireOwner(appointmentId, accountId);

export const rescheduleOwnerAppointment = async ({
  appointmentId,
  accountId,
  role,
  scheduledDate,
  timeslotId,
  vetId,
}) => {
  const appointment = await getAppointment(appointmentId, { accountId, role });
  if (!appointment) {
    return null;
  }

  await updateAppointmentSchedule({
    appointmentId,
    scheduledDate: new Date(`${scheduledDate}T00:00:00.000Z`),
    timeslotId,
    vetId,
  });

  emitAppointmentChanged(appointment.pet.owner.accountId, {
    type: "rescheduled",
    appointmentId,
  });

  return appointment;
};

export const getPendingAppointmentsCount = () =>
  countPendingAppointments();

export const getTodaysPendingAppointmentsCount = () =>
  countTodaysPendingAppointments();