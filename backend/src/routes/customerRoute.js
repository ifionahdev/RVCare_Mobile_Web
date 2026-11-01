import { Router } from "express";
import {
  getCustomerCount,
  getMyProfile,
} from "../controllers/customerController.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";

const router = Router();

router.get("/me", authenticate, requireRole("customer"), getMyProfile);
router.get("/count", authenticate, requireRole("admin"), getCustomerCount);

export default router;
