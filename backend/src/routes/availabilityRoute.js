import { Router } from "express";
import { getAvailableTimeslots } from "../controllers/availabilityController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticate, getAvailableTimeslots);

export default router;
