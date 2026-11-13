import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import { findActiveCustomersWithPets } from "../models/customerModel.js";
import { sendOwnerCredentials } from "../services/emailService.js";
import { createAuditLog } from "../services/auditLogService.js";

const normalizePhone = (phone) => {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (digits.startsWith("63")) return `0${digits.slice(2)}`.slice(0, 11);
  if (digits.startsWith("0")) return digits.slice(0, 11);
  return `09${digits}`.slice(0, 11);
};

const parseDate = (value, required = false) => {
  if (!value) {
    if (required) throw new Error("Required date is missing.");
    return null;
  }

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) throw new Error("Invalid date format.");
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (Number.isNaN(date.getTime())) throw new Error("Invalid date format.");
  return date;
};

const formatDateOnly = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
};

const serializeOwner = (owner) => ({
  accId: owner.account.accountId,
  ownerId: owner.ownerId,
  name: `${owner.account.firstName} ${owner.account.lastName}`,
  firstName: owner.account.firstName,
  lastName: owner.account.lastName,
  email: owner.account.email,
  gender: owner.account.gender,
  dateOfBirth: owner.account.dateOfBirth,
  contactNo: owner.contactNumber,
  address: owner.address,
  createdAt: owner.account.dateRegistered,
  pets: owner.pets.map((pet) => ({
    petID: pet.petId,
    accID: owner.account.accountId,
    petName: pet.petName,
    petType: pet.breed.species,
    breedName: pet.breed.breedName,
    petGender: pet.gender,
    dateOfBirth: pet.dateOfBirth,
    weight_kg: pet.weightKg == null ? null : Number(pet.weightKg),
    color: pet.color,
    note: pet.note,
  })),
});

export const getOwnersWithPets = async (req, res, next) => {
  try {
    const owners = await findActiveCustomersWithPets();
    return res.json(owners.map(serializeOwner));
  } catch (error) {
    return next(error);
  }
};

export const getBreeds = async (req, res, next) => {
  try {
    const species = String(req.query.species ?? "");
    if (!["Dog", "Cat"].includes(species)) {
      return res.status(400).json({ message: "Invalid pet type." });
    }

    const breeds = await prisma.petBreed.findMany({
      where: {
        isDeleted: false,
        species,
      },
      orderBy: { breedName: "asc" },
    });
    return res.json(breeds);
  } catch (error) {
    return next(error);
  }
};

export const getSpecies = async (req, res, next) => {
  try {
    return res.json(["Dog", "Cat"]);
  } catch (error) {
    return next(error);
  }
};

export const addOwner = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, address, sex, dob, pets } = req.body;
    const required = [firstName, lastName, email, phone, sex, dob];
    if (required.some((value) => !String(value ?? "").trim())) {
      return res.status(400).json({ message: "Owner details are required." });
    }

    if (!["Male", "Female"].includes(sex)) {
      return res.status(400).json({ message: "Invalid gender." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await prisma.account.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const customerRole = await prisma.role.findUnique({
      where: { roleSlug: "customer" },
    });
    if (!customerRole) {
      return res.status(500).json({ message: "Customer role is not configured." });
    }

    const initialPet = Array.isArray(pets) ? pets[0] : null;
    if (!initialPet || !initialPet.name || !initialPet.type || !initialPet.breed || !initialPet.dob) {
      return res.status(400).json({ message: "Pet details are required." });
    }
    if (!["Male", "Female"].includes(initialPet.sex)) {
      return res.status(400).json({ message: "Invalid pet gender." });
    }

    const password = crypto.randomBytes(9).toString("base64url");
    const username = `${normalizedEmail.slice(0, 42)}-${crypto.randomBytes(4).toString("hex")}`;
    const created = await prisma.$transaction(async (tx) => {
      const account = await tx.account.create({
        data: {
          roleId: customerRole.roleId,
          username,
          email: normalizedEmail,
          password: await bcrypt.hash(password, 12),
          firstName: String(firstName).trim(),
          lastName: String(lastName).trim(),
          gender: sex,
          dateOfBirth: parseDate(dob),
        },
      });

      const owner = await tx.petOwner.create({
        data: {
          accountId: account.accountId,
          address: String(address ?? "").trim() || null,
          contactNumber: normalizePhone(phone),
        },
      });

      let breed = await tx.petBreed.findFirst({
        where: { breedName: initialPet.breed, species: initialPet.type, isDeleted: false },
      });
      if (!breed) {
        breed = await tx.petBreed.create({
          data: { breedName: initialPet.breed, species: initialPet.type },
        });
      }

      const pet = await tx.pet.create({
        data: {
          ownerId: owner.ownerId,
          petName: initialPet.name,
          breedId: breed.breedId,
          gender: initialPet.sex,
          dateOfBirth: parseDate(initialPet.dob, true),
          weightKg: initialPet.weight ? Number(initialPet.weight) : null,
          color: String(initialPet.color ?? "").trim() || null,
          note: String(initialPet.notes ?? "").trim() || null,
        },
      });

      await createAuditLog(tx, {
        accountId: req.user.accountId,
        action: "Created",
        targetTable: "tbl_account",
        targetId: account.accountId,
        newValue: {
          firstName: account.firstName,
          lastName: account.lastName,
          email: account.email,
          role: "customer",
        },
      });
      await createAuditLog(tx, {
        accountId: req.user.accountId,
        action: "Created",
        targetTable: "tbl_pet_owner",
        targetId: owner.ownerId,
        newValue: {
          address: owner.address,
          contactNumber: owner.contactNumber,
        },
      });
      await createAuditLog(tx, {
        accountId: req.user.accountId,
        action: "Created",
        targetTable: "tbl_pet",
        targetId: pet.petId,
        newValue: {
          petName: pet.petName,
          breedId: pet.breedId,
          gender: pet.gender,
          dateOfBirth: pet.dateOfBirth,
          weightKg: pet.weightKg,
          color: pet.color,
          note: pet.note,
        },
      });

      return account;
    });

    try {
      await sendOwnerCredentials(normalizedEmail, password);
    } catch (error) {
      console.error("[email] Owner account email failed:", error.message);
    }

    return res.status(201).json({
      email: created.email,
      password,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateOwner = async (req, res, next) => {
  try {
    const accountId = Number(req.params.accountId);
    const { firstName, lastName, email, phone, address, sex, dob } = req.body;

    await prisma.$transaction(async (tx) => {
      const currentAccount = await tx.account.findUniqueOrThrow({
        where: { accountId },
      });
      const currentOwner = await tx.petOwner.findUniqueOrThrow({
        where: { accountId },
      });
      const account = await tx.account.update({
        where: { accountId },
        data: {
          firstName: String(firstName).trim(),
          lastName: String(lastName).trim(),
          email: String(email).trim().toLowerCase(),
          gender: sex,
          dateOfBirth: parseDate(dob),
        },
      });
      const owner = await tx.petOwner.update({
        where: { accountId: account.accountId },
        data: {
          address: String(address ?? "").trim() || null,
          contactNumber: normalizePhone(phone),
        },
      });
      await createAuditLog(tx, {
        accountId: req.user.accountId,
        action: "Updated",
        targetTable: "tbl_account",
        targetId: accountId,
        oldValue: {
          firstName: currentAccount.firstName,
          lastName: currentAccount.lastName,
          email: currentAccount.email,
          gender: currentAccount.gender,
          dateOfBirth: currentAccount.dateOfBirth,
        },
        newValue: {
          firstName: account.firstName,
          lastName: account.lastName,
          email: account.email,
          gender: account.gender,
          dateOfBirth: account.dateOfBirth,
        },
      });
      await createAuditLog(tx, {
        accountId: req.user.accountId,
        action: "Updated",
        targetTable: "tbl_pet_owner",
        targetId: owner.ownerId,
        oldValue: {
          address: currentOwner.address,
          contactNumber: currentOwner.contactNumber,
        },
        newValue: {
          address: owner.address,
          contactNumber: owner.contactNumber,
        },
      });
    });

    return res.json({ message: "Owner updated successfully" });
  } catch (error) {
    return next(error);
  }
};

const findBreed = async (tx, type, breed) => {
  let result = await tx.petBreed.findFirst({
    where: { breedName: breed, species: type, isDeleted: false },
  });

  if (!result) {
    result = await tx.petBreed.create({
      data: { breedName: breed, species: type },
    });
  }

  return result;
};

export const addPet = async (req, res, next) => {
  try {
    const { ownerId, name, type, breed, sex, dob, weight, color, notes } = req.body;
    if (!ownerId || !name || !type || !breed || !sex || !dob) {
      return res.status(400).json({ message: "Complete pet details are required." });
    }

    const pet = await prisma.$transaction(async (tx) => {
      const breedRecord = await findBreed(tx, type, breed);
      const selectedOwner = await tx.petOwner.findFirst({
        where: {
          OR: [{ ownerId: Number(ownerId) }, { accountId: Number(ownerId) }],
          isDeleted: false,
        },
      });
      if (!selectedOwner) {
        throw new Error("Selected pet owner was not found.");
      }
      const pet = await tx.pet.create({
        data: {
          ownerId: selectedOwner.ownerId,
          petName: String(name).trim(),
          breedId: breedRecord.breedId,
          gender: sex,
          dateOfBirth: parseDate(dob, true),
          weightKg: weight ? Number(weight) : null,
          color: String(color ?? "").trim() || null,
          note: String(notes ?? "").trim() || null,
        },
      });
      await createAuditLog(tx, {
        accountId: req.user.accountId,
        action: "Created",
        targetTable: "tbl_pet",
        targetId: pet.petId,
        newValue: {
          petName: pet.petName,
          ownerId: pet.ownerId,
          breedId: pet.breedId,
          gender: pet.gender,
          dateOfBirth: pet.dateOfBirth,
          weightKg: pet.weightKg,
          color: pet.color,
          note: pet.note,
        },
      });
      return pet;
    });

    return res.status(201).json({ petId: pet.petId });
  } catch (error) {
    return next(error);
  }
};

export const updatePet = async (req, res, next) => {
  try {
    const petId = Number(req.params.petId);
    const { ownerId, name, type, breed, sex, dob, weight, color, notes } = req.body;

    const pet = await prisma.$transaction(async (tx) => {
      const existing = await tx.pet.findUniqueOrThrow({
        where: { petId },
        include: { breed: true },
      });
      const breedRecord = await findBreed(tx, type, breed);
      let selectedOwnerId;
      if (ownerId) {
        const selectedOwner = await tx.petOwner.findFirst({
          where: {
            OR: [{ ownerId: Number(ownerId) }, { accountId: Number(ownerId) }],
            isDeleted: false,
          },
        });
        if (!selectedOwner) {
          throw new Error("Selected pet owner was not found.");
        }
        selectedOwnerId = selectedOwner.ownerId;
      }
      const updated = await tx.pet.update({
        where: { petId },
        data: {
          ownerId: selectedOwnerId,
          petName: String(name).trim(),
          breedId: breedRecord.breedId,
          gender: sex,
          dateOfBirth: parseDate(dob, true),
          weightKg: weight ? Number(weight) : null,
          color: String(color ?? "").trim() || null,
          note: String(notes ?? "").trim() || null,
        },
      });
      await createAuditLog(tx, {
        accountId: req.user.accountId,
        action: "Updated",
        targetTable: "tbl_pet",
        targetId: petId,
        oldValue: {
          petName: existing.petName,
          breed: existing.breed.breedName,
          gender: existing.gender,
          dateOfBirth: existing.dateOfBirth,
          weightKg: existing.weightKg,
          color: existing.color,
          note: existing.note,
        },
        newValue: {
          petName: updated.petName,
          breed: breedRecord.breedName,
          gender: updated.gender,
          dateOfBirth: updated.dateOfBirth,
          weightKg: updated.weightKg,
          color: updated.color,
          note: updated.note,
        },
      });
      return updated;
    });

    return res.json({ petId: pet.petId });
  } catch (error) {
    return next(error);
  }
};

export const softDeleteOwner = async (req, res, next) => {
  try {
    const accountId = Number(req.params.accountId);
    await prisma.$transaction(async (tx) => {
      const account = await tx.account.findUniqueOrThrow({ where: { accountId } });
      const owner = await tx.petOwner.findUniqueOrThrow({ where: { accountId } });
      await tx.account.update({
        where: { accountId },
        data: { isDeleted: true },
      });
      await tx.petOwner.updateMany({
        where: { accountId },
        data: { isDeleted: true },
      });
      await createAuditLog(tx, {
        accountId: req.user.accountId,
        action: "Deleted",
        targetTable: "tbl_account",
        targetId: accountId,
        oldValue: {
          firstName: account.firstName,
          lastName: account.lastName,
          email: account.email,
          isDeleted: false,
        },
        newValue: {
          firstName: account.firstName,
          lastName: account.lastName,
          email: account.email,
          isDeleted: true,
        },
      });
      await createAuditLog(tx, {
        accountId: req.user.accountId,
        action: "Deleted",
        targetTable: "tbl_pet_owner",
        targetId: owner.ownerId,
        oldValue: {
          address: owner.address,
          contactNumber: owner.contactNumber,
          isDeleted: false,
        },
        newValue: {
          address: owner.address,
          contactNumber: owner.contactNumber,
          isDeleted: true,
        },
      });
    });
    return res.json({ message: "Owner deleted successfully." });
  } catch (error) {
    return next(error);
  }
};

export const softDeletePet = async (req, res, next) => {
  try {
    const petId = Number(req.params.petId);
    await prisma.$transaction(async (tx) => {
      const pet = await tx.pet.findUniqueOrThrow({
        where: { petId },
        include: { breed: true },
      });
      await tx.pet.update({
        where: { petId },
        data: { isDeleted: true },
      });
      await createAuditLog(tx, {
        accountId: req.user.accountId,
        action: "Deleted",
        targetTable: "tbl_pet",
        targetId: petId,
        oldValue: {
          petName: pet.petName,
          breed: pet.breed.breedName,
          gender: pet.gender,
          dateOfBirth: pet.dateOfBirth,
          weightKg: pet.weightKg,
          color: pet.color,
          note: pet.note,
          isDeleted: false,
        },
        newValue: {
          petName: pet.petName,
          breed: pet.breed.breedName,
          gender: pet.gender,
          dateOfBirth: pet.dateOfBirth,
          weightKg: pet.weightKg,
          color: pet.color,
          note: pet.note,
          isDeleted: true,
        },
      });
    });
    return res.json({ message: "Pet deleted successfully." });
  } catch (error) {
    return next(error);
  }
};

const formatTime = (value) => {
  if (!value) return "";
  if (value instanceof Date) {
    let hour = value.getUTCHours();
    const minute = String(value.getUTCMinutes()).padStart(2, "0");
    const meridiem = hour >= 12 ? "PM" : "AM";
    hour %= 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minute} ${meridiem}`;
  }
  const match = String(value).match(/^(\d{1,2}):(\d{2})/);
  const timeMatch = String(value).match(/T(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    let hour = Number(timeMatch[1]);
    const minute = timeMatch[2];
    const meridiem = hour >= 12 ? "PM" : "AM";
    hour %= 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minute} ${meridiem}`;
  }
  if (!match) return String(value);
  let hour = Number(match[1]);
  const minute = match[2];
  const meridiem = hour >= 12 ? "PM" : "AM";
  hour %= 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${meridiem}`;
};

const veterinarianName = (veterinarian) => {
  const account = veterinarian?.account;
  if (!account) return "";
  return `${account.firstName ?? ""} ${account.lastName ?? ""}`.trim();
};

const appointmentDto = (appointment) => ({
  id: appointment.appointmentId,
  petName: appointment.pet.petName,
  petId: appointment.petId,
  owner: `${appointment.pet.owner.account.firstName} ${appointment.pet.owner.account.lastName}`,
  ownerId: appointment.pet.owner.accountId,
  email: appointment.pet.owner.account.email,
  phone: appointment.pet.owner.contactNumber,
  veterinarian: veterinarianName(appointment.veterinarian),
  vetId: appointment.vetId,
  breedName: appointment.pet.breed?.breedName,
  petSex: appointment.pet.gender,
  weight: appointment.pet.weightKg == null ? null : Number(appointment.pet.weightKg),
  petAge: appointment.pet.dateOfBirth
    ? String(Math.max(0, new Date().getFullYear() - appointment.pet.dateOfBirth.getFullYear()))
    : null,
  serviceType: appointment.service.serviceName,
  serviceID: appointment.serviceId,
  description: appointment.service.description,
  date: formatDateOnly(appointment.scheduledDate),
  time: formatTime(appointment.timeslot.startTime),
  status: appointment.status,
});

const visitDto = (visit) => ({
  id: visit.visitId,
  appointmentId: visit.appointmentId,
  petName: visit.pet.petName,
  petId: visit.petId,
  owner: `${visit.pet.owner.account.firstName} ${visit.pet.owner.account.lastName}`,
  ownerId: visit.pet.owner.accountId,
  email: visit.pet.owner.account.email,
  phone: visit.pet.owner.contactNumber,
  veterinarian: veterinarianName(visit.veterinarian),
  vetId: visit.vetId,
  breedName: visit.pet.breed?.breedName,
  petSex: visit.pet.gender,
  weight: visit.pet.weightKg == null ? null : Number(visit.pet.weightKg),
  serviceType: visit.service.serviceName,
  serviceID: visit.serviceId,
  description: visit.service.description,
  date: formatDateOnly(visit.visitDate),
  time: formatTime(visit.visitTime),
  status: visit.status,
  visitType: visit.appointmentId ? "Scheduled" : "Walk-in",
});

export const getAdminAppointments = async (req, res, next) => {
  try {
    const [appointments, visits] = await Promise.all([
      prisma.appointment.findMany({
        where: { isDeleted: false },
        include: {
          pet: { include: { owner: { include: { account: true } }, breed: true } },
          service: true,
          timeslot: true,
          veterinarian: { include: { account: true } },
        },
        orderBy: [{ scheduledDate: "desc" }, { appointmentId: "desc" }],
      }),
      prisma.visit.findMany({
        where: { isDeleted: false },
        include: {
          pet: { include: { owner: { include: { account: true } }, breed: true } },
          service: true,
          veterinarian: { include: { account: true } },
        },
        orderBy: [{ visitDate: "desc" }, { visitId: "desc" }],
      }),
    ]);
    return res.json({ cleanedAppointments: appointments.map(appointmentDto), cleanedVisits: visits.map(visitDto) });
  } catch (error) {
    return next(error);
  }
};

export const getAppointmentOwners = async (req, res, next) => {
  try {
    const owners = await findActiveCustomersWithPets();
    const pets = owners.flatMap((owner) => owner.pets.map((pet) => ({
      id: pet.petId,
      userId: owner.accountId,
      accID: owner.accountId,
      petID: pet.petId,
      petName: pet.petName,
      petType: pet.breed.species,
      breedName: pet.breed.breedName,
      petGender: pet.gender,
      name: pet.petName,
      breed: pet.breed.breedName,
    })));
    const appointments = await prisma.appointment.findMany({
      where: { isDeleted: false, status: { in: ["Pending", "Upcoming"] }, visits: null },
      include: {
        pet: { include: { owner: { include: { account: true } }, breed: true } },
        service: true,
        timeslot: true,
        veterinarian: { include: { account: true } },
      },
      orderBy: { scheduledDate: "asc" },
    });
    return res.json({
      owners: owners.map((owner) => ({
        id: owner.accountId,
        ownerId: owner.ownerId,
        firstName: owner.account.firstName,
        lastName: owner.account.lastName,
        email: owner.account.email,
        phone: owner.contactNumber,
      })),
      pets,
      appointments: appointments.map(appointmentDto),
    });
  } catch (error) {
    return next(error);
  }
};

export const getAppointmentTimes = async (req, res, next) => {
  try {
    const timeslots = await prisma.timeslot.findMany({ orderBy: { startTime: "asc" } });
    return res.json(timeslots.map((slot) => ({ ...slot, scheduleTime: slot.startTime })));
  } catch (error) {
    return next(error);
  }
};

export const getBookedSlots = async (req, res, next) => {
  try {
    const date = parseDate(req.query.date, true);
    const appointments = await prisma.appointment.findMany({
      where: { scheduledDate: date, isDeleted: false },
      include: { timeslot: true },
    });
    return res.json({ bookedSlots: appointments.map((appointment) => appointment.timeslot.startTime) });
  } catch (error) {
    return next(error);
  }
};

export const getAppointmentServices = async (req, res, next) => {
  try {
    const services = await prisma.service.findMany({ orderBy: { serviceName: "asc" } });
    return res.json(services.map((service) => ({
      serviceID: service.serviceId, service: service.serviceName, shortDescription: service.description ?? "",
    })));
  } catch (error) {
    return next(error);
  }
};

const parseAppointmentTime = async (time) => {
  const match = String(time).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) throw new Error("Invalid appointment time.");
  let hour = Number(match[1]);
  const minute = match[2];
  const meridiem = match[3]?.toUpperCase();
  if (meridiem) {
    if (meridiem === "PM" && hour !== 12) hour += 12;
    if (meridiem === "AM" && hour === 12) hour = 0;
  }
  const clock = `${String(hour).padStart(2, "0")}:${minute}`;
  const slot = await prisma.timeslot.findFirst({
    where: { OR: [{ startTime: clock }, { display: String(time).trim() }] },
  });
  if (!slot) throw new Error(`Timeslot ${time} was not found.`);
  return slot;
};

export const assignAppointment = async (req, res, next) => {
  try {
    const petId = Number(req.body.petID ?? req.body.petId);
    const serviceId = Number(req.body.serviceID ?? req.body.serviceId);
    const timeslot = await parseAppointmentTime(req.body.time ?? req.body.scheduledTime);
    const scheduledDate = parseDate(req.body.date, true);
    const pet = await prisma.pet.findFirst({ where: { petId, isDeleted: false } });
    if (!pet) return res.status(404).json({ message: "Pet not found." });
    const veterinarian = await prisma.veterinarian.findFirst({ where: { isDeleted: false } });
    if (!veterinarian) return res.status(400).json({ message: "No active veterinarian is available." });
    if (await prisma.appointment.findFirst({ where: { scheduledDate, timeslotId: timeslot.timeslotId, isDeleted: false } })) {
      return res.status(409).json({ message: "That time slot is already booked." });
    }
    const appointment = await prisma.$transaction(async (tx) => {
      const created = await tx.appointment.create({
        data: { petId, serviceId, timeslotId: timeslot.timeslotId, scheduledDate, vetId: veterinarian.vetId },
      });
      await createAuditLog(tx, {
        accountId: req.user.accountId,
        action: "Created",
        targetTable: "tbl_appointment",
        targetId: created.appointmentId,
        newValue: {
          petId: created.petId,
          serviceId: created.serviceId,
          vetId: created.vetId,
          scheduledDate: created.scheduledDate,
          timeslotId: created.timeslotId,
          status: created.status,
        },
      });
      return created;
    });
    return res.status(201).json({ appointmentId: appointment.appointmentId });
  } catch (error) {
    return next(error);
  }
};

export const makeVisit = async (req, res, next) => {
  try {
    const appointmentId = req.body.appointmentId ? Number(req.body.appointmentId) : null;
    const petId = Number(req.body.petID ?? req.body.petId);
    const service = await prisma.service.findFirst({
      where: {
        OR: [
          { serviceId: Number(req.body.serviceID ?? req.body.serviceId) || undefined },
          { serviceName: req.body.serviceType },
        ],
      },
    });
    const veterinarian = await prisma.veterinarian.findFirst({ where: { isDeleted: false } });
    if (!petId || !service || !veterinarian) {
      return res.status(400).json({ message: "Pet, service, and veterinarian are required." });
    }
    if (appointmentId) {
      const linked = await prisma.visit.findUnique({ where: { appointmentId } });
      if (linked && !linked.isDeleted) return res.status(409).json({ message: "A visit already exists for this appointment." });
    }
    const now = new Date();
    const visit = await prisma.$transaction(async (tx) => {
      const created = await tx.visit.create({
        data: { appointmentId, petId, serviceId: service.serviceId, vetId: veterinarian.vetId,
          visitDate: now, visitTime: now },
      });
      await createAuditLog(tx, {
        accountId: req.user.accountId,
        action: "Created",
        targetTable: "tbl_visit",
        targetId: created.visitId,
        newValue: {
          appointmentId: created.appointmentId,
          petId: created.petId,
          serviceId: created.serviceId,
          vetId: created.vetId,
          visitDate: created.visitDate,
          status: created.status,
        },
      });
      return created;
    });
    return res.status(201).json({ visitId: visit.visitId });
  } catch (error) {
    return next(error);
  }
};

export const updateAppointmentStatuses = async (req, res, next) => {
  try {
    const ids = req.body.idsToUpdate ?? req.body.appointmentIds ?? [];
    if (!Array.isArray(ids) || ids.length === 0 || !req.body.status) {
      return res.status(400).json({ message: "Appointment IDs and status are required." });
    }
    const appointmentIds = ids.map(Number).filter(Boolean);
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.appointment.findMany({
        where: { appointmentId: { in: appointmentIds }, isDeleted: false },
        select: { appointmentId: true, status: true },
      });
      const updated = await tx.appointment.updateMany({
        where: { appointmentId: { in: appointmentIds }, isDeleted: false },
        data: { status: req.body.status },
      });
      await Promise.all(existing.map((appointment) =>
        createAuditLog(tx, {
          accountId: req.user.accountId,
          action: "Updated",
          targetTable: "tbl_appointment",
          targetId: appointment.appointmentId,
          oldValue: { status: appointment.status },
          newValue: { status: req.body.status },
        }),
      ));
      return updated;
    });
    return res.json({ updatedCount: result.count });
  } catch (error) {
    return next(error);
  }
};

export const softDeleteAppointments = async (req, res, next) => {
  try {
    const ids = (req.body.idsToDelete ?? []).map(Number).filter(Boolean);
    if (ids.length === 0) return res.status(400).json({ message: "IDs are required." });
    const [appointments, visits] = await prisma.$transaction(async (tx) => {
      const [oldAppointments, oldVisits] = await Promise.all([
        tx.appointment.findMany({
          where: { appointmentId: { in: ids }, isDeleted: false },
          select: { appointmentId: true, status: true },
        }),
        tx.visit.findMany({
          where: { visitId: { in: ids }, isDeleted: false },
          select: { visitId: true, status: true },
        }),
      ]);
      const [updatedAppointments, updatedVisits] = await Promise.all([
        tx.appointment.updateMany({
          where: { appointmentId: { in: ids } },
          data: { isDeleted: true },
        }),
        tx.visit.updateMany({
          where: { visitId: { in: ids } },
          data: { isDeleted: true },
        }),
      ]);
      await Promise.all([
        ...oldAppointments.map((appointment) =>
          createAuditLog(tx, {
            accountId: req.user.accountId,
            action: "Deleted",
            targetTable: "tbl_appointment",
            targetId: appointment.appointmentId,
            oldValue: { status: appointment.status, isDeleted: false },
            newValue: { status: appointment.status, isDeleted: true },
          }),
        ),
        ...oldVisits.map((visit) =>
          createAuditLog(tx, {
            accountId: req.user.accountId,
            action: "Deleted",
            targetTable: "tbl_visit",
            targetId: visit.visitId,
            oldValue: { status: visit.status, isDeleted: false },
            newValue: { status: visit.status, isDeleted: true },
          }),
        ),
      ]);
      return [updatedAppointments, updatedVisits];
    });
    return res.json({ deletedAppointmentCount: appointments.count, deletedVisitCount: visits.count });
  } catch (error) {
    return next(error);
  }
};
