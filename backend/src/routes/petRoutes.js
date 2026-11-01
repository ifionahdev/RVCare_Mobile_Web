import { Router } from "express";
import {
  getPetCount,
  getPetsByOwner,
  getMyPets,
} from "../controllers/petController.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";

const router = Router();

router.get("/me", authenticate, requireRole("customer"), getMyPets);
router.get("/count", authenticate, requireRole("admin"), getPetCount);
router.get(
  "/owner/:ownerId",
  authenticate,
  requireRole("admin", "vet"),
  getPetsByOwner,
);

export default router;