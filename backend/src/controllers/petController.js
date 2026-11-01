import { findPetByOwner, getPetCount as countPets } from "../models/petModel.js";
import { findCustomerByAccount } from "../models/customerModel.js";

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