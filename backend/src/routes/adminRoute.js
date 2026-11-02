import { Router } from "express";
import {
  addOwner,
  getBreeds,
  getOwnersWithPets,
  getSpecies,
  softDeleteOwner,
  softDeletePet,
  addPet,
  updatePet,
  updateOwner,
} from "../controllers/adminController.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";

const router = Router();

router.use(authenticate, requireRole("admin"));
router.get("/owners-with-pets", getOwnersWithPets);
router.post("/add-owner", addOwner);
router.put("/update-owner/:accountId", updateOwner);
router.get("/breeds", getBreeds);
router.get("/species", getSpecies);
router.post("/add-pets", addPet);
router.put("/update-pet/:petId", updatePet);
router.put("/soft-delete-owner/:accountId", softDeleteOwner);
router.put("/soft-delete-pet/:petId", softDeletePet);

export default router;
