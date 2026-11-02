import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import { findActiveCustomersWithPets } from "../models/customerModel.js";
import { sendOwnerCredentials } from "../services/emailService.js";

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

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid date format.");
  return date;
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

      await tx.pet.create({
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
      await tx.petOwner.update({
        where: { accountId: account.accountId },
        data: {
          address: String(address ?? "").trim() || null,
          contactNumber: normalizePhone(phone),
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
      return tx.pet.create({
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
      return tx.pet.update({
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
    });

    return res.json({ petId: pet.petId });
  } catch (error) {
    return next(error);
  }
};

export const softDeleteOwner = async (req, res, next) => {
  try {
    const accountId = Number(req.params.accountId);
    await prisma.$transaction([
      prisma.account.update({
        where: { accountId },
        data: { isDeleted: true },
      }),
      prisma.petOwner.updateMany({
        where: { accountId },
        data: { isDeleted: true },
      }),
    ]);
    return res.json({ message: "Owner deleted successfully." });
  } catch (error) {
    return next(error);
  }
};

export const softDeletePet = async (req, res, next) => {
  try {
    await prisma.pet.update({
      where: { petId: Number(req.params.petId) },
      data: { isDeleted: true },
    });
    return res.json({ message: "Pet deleted successfully." });
  } catch (error) {
    return next(error);
  }
};
