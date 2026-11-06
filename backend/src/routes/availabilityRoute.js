import { Router } from "express";
import {
  getAvailableTimeslots,
  suggestAvailability,
} from "../controllers/availabilityController.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";

const router = Router();

router.get("/", authenticate, getAvailableTimeslots);
router.post(
  "/suggest",
  authenticate,
  requireRole("customer"),
  suggestAvailability,
);

export default router;
