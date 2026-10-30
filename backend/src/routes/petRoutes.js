import { Router } from "express";
import { getPetsByOwner } from "../controllers/petController.js";
import { getMyPets } from "../controllers/petController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.get("/me", authenticate, getMyPets);
router.get("/owner/:ownerId", authenticate, getPetsByOwner);

export default router;