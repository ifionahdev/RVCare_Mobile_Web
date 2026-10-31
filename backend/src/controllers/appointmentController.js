import { prisma } from "../config/prisma.js";
import {
  findOwnerAppointments,
  findAppointmentById,
} from "../models/appointmentModel.js";
import { emitAppointmentChanged } from "../realtime.js";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const requireOwner = async (appointmentId, accountId) => {
  const appointment = await findAppointmentById(appointmentId);
  if (!appointment) return null;

  return appointment.pet.owner.accountId === accountId ? appointment : null;
};

export const createAppointment = async (req, res, next) => {
  try {
    const { petId, serviceId, vetId, scheduledDate, timeslotId } = req.body ?? {};
    if (
      !Number.isInteger(Number(petId)) ||
      !Number.isInteger(Number(serviceId)) ||
      !Number.isInteger(Number(timeslotId)) ||
      !DATE_PATTERN.test(scheduledDate)
    ) {
      return res.status(400).json({ message: "Invalid appointment details." });
    }

    const owner = await prisma.petOwner.findFirst({
      where: { accountId: req.user.accountId, isDeleted: false },
      select: { ownerId: true },
    });
    const pet = await prisma.pet.findFirst({
      where: { petId: Number(petId), ownerId: owner?.ownerId, isDeleted: false },
    });
    if (!pet) {
      return res.status(403).json({ message: "You can only book for your own pets." });
    }

    const parsedVetId = vetId === undefined || vetId === null || vetId === ""
      ? undefined
      : Number(vetId);
    const selectedVetId =
      parsedVetId ??
      (await prisma.veterinarian.findFirst({
        where: { isDeleted: false },
        select: { vetId: true },
        orderBy: { vetId: "asc" },
      }))?.vetId;

    if (!selectedVetId) {
      return res.status(400).json({ message: "No veterinarian is available." });
    }

    const appointment = await prisma.appointment.create({
      data: {
        petId: Number(petId),
        serviceId: Number(serviceId),
        vetId: selectedVetId,
        scheduledDate: new Date(`${scheduledDate}T00:00:00.000Z`),
        timeslotId: Number(timeslotId),
        status: "Pending",
      },
    });

    emitAppointmentChanged(req.user.accountId, {
      type: "created",
      appointmentId: appointment.appointmentId,
    });

    return res.status(201).json({ appointmentId: appointment.appointmentId });
  } catch (error) {
    if (error?.code === "P2002") {
      return res.status(409).json({ message: "That time slot is already booked." });
    }
    return next(error);
  }
};

export const getAppointments = async (req, res, next) => {
  try {
    const appointments = await findOwnerAppointments(req.user.accountId);
    return res.json(appointments);
  } catch (error) {
    return next(error);
  }
};

export const getAppointment = async (req, res, next) => {
  try {
    const appointment = await requireOwner(Number(req.params.appointmentId), req.user.accountId);
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
    const appointment = await requireOwner(appointmentId, req.user.accountId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }
    if (!DATE_PATTERN.test(req.body?.scheduledDate)) {
      return res.status(400).json({ message: "Invalid scheduled date." });
    }

    const timeslotId = Number(req.body.timeslotId);
    if (!Number.isInteger(timeslotId)) {
      return res.status(400).json({ message: "Invalid time slot." });
    }
    const vetId =
      req.body.vetId === undefined || req.body.vetId === null || req.body.vetId === ""
        ? undefined
        : Number(req.body.vetId);
    if (vetId !== undefined && (!Number.isInteger(vetId) || vetId <= 0)) {
      return res.status(400).json({ message: "Invalid veterinarian." });
    }

    await prisma.appointment.update({
      where: { appointmentId },
      data: {
        scheduledDate: new Date(`${req.body.scheduledDate}T00:00:00.000Z`),
        timeslotId,
        ...(vetId === undefined ? {} : { vetId }),
      },
    });
    emitAppointmentChanged(req.user.accountId, {
      type: "rescheduled",
      appointmentId,
    });
    return res.json({ message: "Appointment rescheduled." });
  } catch (error) {
    if (error?.code === "P2002") {
      return res.status(409).json({ message: "That time slot is already booked." });
    }
    return next(error);
  }
};
