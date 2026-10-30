import { Router } from "express";
import { getVeterinarians } from "../controllers/vetController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticate, getVeterinarians);

export default router;
