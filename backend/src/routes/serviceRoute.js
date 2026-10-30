import { Router } from "express";
import { getServices } from "../controllers/serviceController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticate, getServices);

export default router;