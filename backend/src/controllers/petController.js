import { prisma } from "../config/prisma.js";
import {
  findPetByOwner,
  getPetCount as countPets,
} from "../models/petModel.js";
import { findCustomerByAccount } from "../models/customerModel.js";
import { createAuditLog } from "../services/auditLogService.js";

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const PET_SPECIES = new Set(["Cat", "Dog"]);
const PET_GENDERS = new Set(["Male", "Female"]);

const parseDateOnly = (value) => {
  if (typeof value !== "string") return null;
  const match = DATE_PATTERN.exec(value);
  if (!match) return null;

  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );
  return date.toISOString().slice(0, 10) === value ? date : null;
};

const readPetInput = (body) => {
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const species = body?.species ?? body?.type;
  const breed = typeof body?.breed === "string" ? body.breed.trim() : "";
  const gender = body?.gender ?? body?.sex;
  const dateOfBirth = body?.dateOfBirth ?? body?.dob;
  const weightValue = body?.weightKg ?? body?.weight;
  const color = typeof body?.color === "string" ? body.color.trim() : "";
  const note =
    typeof body?.note === "string"
      ? body.note.trim()
      : typeof body?.notes === "string"
        ? body.notes.trim()
        : "";

  if (!name || name.length > 100) {
    return { error: "Pet name is required and must be 100 characters or fewer." };
  }
  if (!PET_SPECIES.has(species)) {
    return { error: "Species must be Cat or Dog." };
  }
  if (!breed || breed.length > 100) {
    return { error: "Breed is required and must be 100 characters or fewer." };
  }
  if (!PET_GENDERS.has(gender)) {
    return { error: "Gender must be Male or Female." };
  }

  const parsedDate = parseDateOnly(dateOfBirth);
  if (!parsedDate || parsedDate > new Date()) {
    return { error: "Date of birth must be a valid past date in YYYY-MM-DD format." };
  }

  let weightKg = null;
  if (weightValue !== undefined && weightValue !== null && weightValue !== "") {
    weightKg = Number(weightValue);
    if (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 999.99) {
      return { error: "Weight must be greater than 0 and no more than 999.99 kg." };
    }
  }

  if (color.length > 100 || note.length > 500) {
    return { error: "Color or notes exceed the allowed length." };
  }

  return {
    value: {
      name,
      species,
      breed,
      gender,
      dateOfBirth: parsedDate,
      weightKg,
      color: color || null,
      note: note || null,
    },
  };
};

export const createMyPet = async (req, res, next) => {
  try {
    const input = readPetInput(req.body);
    if (input.error) {
      return res.status(400).json({ message: input.error });
    }

    const owner = await findCustomerByAccount(req.user.accountId);
    if (!owner) {
      return res.status(404).json({ message: "Pet owner profile not found." });
    }

    const pet = await prisma.$transaction(async (tx) => {
      const breed = await tx.petBreed.findFirst({
        where: {
          breedName: input.value.breed,
          species: input.value.species,
          isDeleted: false,
        },
        select: { breedId: true, breedName: true },
      });

      if (!breed) {
        const error = new Error("The selected breed is not available.");
        error.statusCode = 400;
        throw error;
      }

      const created = await tx.pet.create({
        data: {
          ownerId: owner.ownerId,
          petName: input.value.name,
          breedId: breed.breedId,
          gender: input.value.gender,
          dateOfBirth: input.value.dateOfBirth,
          weightKg: input.value.weightKg,
          color: input.value.color,
          note: input.value.note,
        },
        include: { breed: true },
      });

      await createAuditLog(tx, {
        accountId: req.user.accountId,
        action: "Created",
        targetTable: "tbl_pet",
        targetId: created.petId,
        newValue: {
          petName: created.petName,
          ownerId: created.ownerId,
          breedId: created.breedId,
          gender: created.gender,
          dateOfBirth: created.dateOfBirth,
          weightKg: created.weightKg,
          color: created.color,
          note: created.note,
        },
      });

      return created;
    });

    return res.status(201).json(pet);
  } catch (error) {
    if (error?.statusCode === 400) {
      return res.status(400).json({ message: error.message });
    }
    return next(error);
  }
};

export const getPetsByOwner = async (req, res, next) => {
  try {
    const ownerId = Number(req.params.ownerId); // drop Number() if your id is a String/UUID
    if (Number.isNaN(ownerId)) {
      return res.status(400).json({ message: "Invalid owner id" });
    }

    const pets = await findPetByOwner(ownerId);
    res.json(pets);
  } catch (err) {
    next(err);
  }
};

export const getMyPets = async (req, res, next) => {
  try {
    const owner = await findCustomerByAccount(req.user.accountId);
    if (!owner) {
      return res.status(404).json({ message: "Pet owner profile not found." });
    }

    const pets = await findPetByOwner(owner.ownerId);
    return res.json(pets);
  } catch (error) {
    return next(error);
  }
};

export const getPetCount = async (req, res, next) => {
  try {
    const count = await countPets();
    return res.json({ count });
  } catch (error) {
    return next(error);
  }
};