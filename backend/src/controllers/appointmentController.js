import {
  AppointmentServiceError,
  createAppointment as createAppointmentRecord,
  getAllAppointments,
  getAppointment as getAppointmentRecord,
  getOwnerAppointments,
  getPendingAppointmentsCount as countPendingAppointments,
  getTodaysPendingAppointmentsCount as countTodaysPendingAppointments,
  rescheduleOwnerAppointment,
} from "../services/appointmentService.js";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const parseOptionalId = (value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const handleAppointmentError = (error, next, res) => {
  if (error instanceof AppointmentServiceError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  if (error?.code === "P2002") {
    return res.status(409).json({ message: "That time slot is already booked." });
  }

  return next(error);
};

export const createAppointment = async (req, res, next) => {
  try {
    const { petId, serviceId, vetId, scheduledDate, timeslotId } = req.body ?? {};
    const parsedPetId = Number(petId);
    const parsedServiceId = Number(serviceId);
    const parsedTimeslotId = Number(timeslotId);
    const parsedVetId = parseOptionalId(vetId);

    if (
      !Number.isInteger(parsedPetId) ||
      !Number.isInteger(parsedServiceId) ||
      !Number.isInteger(parsedTimeslotId) ||
      !DATE_PATTERN.test(scheduledDate) ||
      parsedPetId <= 0 ||
      parsedServiceId <= 0 ||
      parsedTimeslotId <= 0 ||
      parsedVetId === null
    ) {
      return res.status(400).json({ message: "Invalid appointment details." });
    }

    const appointment = await createAppointmentRecord({
      accountId: req.user.accountId,
      petId: parsedPetId,
      serviceId: parsedServiceId,
      vetId: parsedVetId,
      scheduledDate,
      timeslotId: parsedTimeslotId,
    });

    return res.status(201).json({ appointmentId: appointment.appointmentId });
  } catch (error) {
    return handleAppointmentError(error, next, res);
  }
};

export const getMyAppointments = async (req, res, next) => {
  try {
    const appointments = await getOwnerAppointments(req.user.accountId);
    return res.json(appointments);
  } catch (error) {
    return next(error);
  }
};

export const getAppointments = async (req, res, next) => {
  try {
    const appointments = await getAllAppointments();
    return res.json(appointments);
  } catch (error) {
    return next(error);
  }
};

export const getAppointment = async (req, res, next) => {
  try {
    const appointment = await getAppointmentRecord(
      Number(req.params.appointmentId),
      { accountId: req.user.accountId, role: req.user.role },
    );
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }
    return res.json(appointment);
  } catch (error) {
    return next(error);
  }
};

export const rescheduleAppointment = async (req, res, next) => {
  try {
    const appointmentId = Number(req.params.appointmentId);
    const { scheduledDate } = req.body ?? {};
    const timeslotId = Number(req.body?.timeslotId);
    const vetId = parseOptionalId(req.body?.vetId);

    if (!DATE_PATTERN.test(scheduledDate)) {
      return res.status(400).json({ message: "Invalid scheduled date." });
    }
    if (!Number.isInteger(timeslotId) || timeslotId <= 0) {
      return res.status(400).json({ message: "Invalid time slot." });
    }
    if (vetId === null) {
      return res.status(400).json({ message: "Invalid veterinarian." });
    }

    const appointment = await rescheduleOwnerAppointment({
      appointmentId,
      accountId: req.user.accountId,
      role: req.user.role,
      scheduledDate,
      timeslotId,
      vetId,
    });
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    return res.json({ message: "Appointment rescheduled." });
  } catch (error) {
    return handleAppointmentError(error, next, res);
  }
};

export const getPendingAppointmentsCount = async (req, res, next) => {
  try {
    const count = await countPendingAppointments();
    return res.json({ count });
  } catch (error) {
    return next(error);
  }
};

export const getTodaysPendingAppointmentsCount = async (req, res, next) => {
  try {
    const count = await countTodaysPendingAppointments();
    return res.json({ count });
  } catch (error) {
    return next(error);
  }
};
