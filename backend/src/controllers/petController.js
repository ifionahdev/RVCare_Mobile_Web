import { findOwnerByAccount, findPetByOwner } from "../models/petModel.js";

export const getPetsByOwner = async (req, res, next) => {
  try {
    const ownerId = Number(req.params.ownerId); // drop Number() if your id is a String/UUID
    if (Number.isNaN(ownerId)) {
      return res.status(400).json({ message: "Invalid owner id" });
    }
    if (req.user.role === "customer" && req.user.profileId !== ownerId) {
      return res.status(403).json({ message: "You can only view your own pets." });
    }

    const pets = await findPetByOwner(ownerId);
    res.json(pets);
  } catch (err) {
    next(err);
  }
};

export const getMyPets = async (req, res, next) => {
  try {
    const owner = await findOwnerByAccount(req.user.accountId);
    if (!owner) {
      return res.status(404).json({ message: "Pet owner profile not found." });
    }

    const pets = await findPetByOwner(owner.ownerId);
    return res.json(pets);
  } catch (error) {
    return next(error);
  }
};