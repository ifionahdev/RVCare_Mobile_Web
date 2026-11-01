import {
  AppointmentServiceError,
  createAppointment as createAppointmentRecord,
  getAppointment as getAppointmentRecord,
  rescheduleOwnerAppointment,
} from "../services/appointmentService.js";
import {
  findAllAppointments,
  findOwnerAppointments,
  getPendingAppointmentsCount as countPendingAppointments,
  getTodaysAppointmentsCount as countTodaysAppointments,
  getAppointmentCountPerStatus as countAppointmentPerStatus,
} from "../models/appointmentModel.js";

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

    const appointment = await createAppointmentRecord({
      accountId: req.user.accountId,
      petId,
      serviceId,
      vetId,
      scheduledDate,
      timeslotId,
    });

    return res.status(201).json({ appointmentId: appointment.appointmentId });
  } catch (error) {
    return handleAppointmentError(error, next, res);
  }
};

export const getMyAppointments = async (req, res, next) => {
  try {
    const appointments = await findOwnerAppointments(req.user.accountId);
    return res.json(appointments);
  } catch (error) {
    return next(error);
  }
};

export const getAppointments = async (req, res, next) => {
  try {
    const appointments = await findAllAppointments();
    return res.json(appointments);
  } catch (error) {
    return next(error);
  }
};

export const getAppointment = async (req, res, next) => {
  try {
    const appointment = await getAppointmentRecord(
      req.params.appointmentId,
      { accountId: req.user.accountId, role: req.user.role },
    );
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }
    return res.json(appointment);
  } catch (error) {
    return handleAppointmentError(error, next, res);
  }
};

export const rescheduleAppointment = async (req, res, next) => {
  try {
    const { scheduledDate } = req.body ?? {};

    const appointment = await rescheduleOwnerAppointment({
      appointmentId: req.params.appointmentId,
      accountId: req.user.accountId,
      role: req.user.role,
      scheduledDate,
      timeslotId: req.body?.timeslotId,
      vetId: req.body?.vetId,
    });
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    return res.json({ message: "Appointment rescheduled." });
  } catch (error) {
    return handleAppointmentError(error, next, res);
  }
};

export const getPendingAppointmentsCount = async (req, res) => {
  const count = await countPendingAppointments();
  return res.json({ count });
};

export const getTodaysAppointmentsCount = async (req, res) => {
  const count = await countTodaysAppointments();
  return res.json({ count });
};

export const getAppointmentPerStatusCount = async (req, res) => {
  const countPerStatus = await countAppointmentPerStatus();
  return res.json(countPerStatus);
};
