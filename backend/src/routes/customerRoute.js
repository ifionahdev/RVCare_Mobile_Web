import { Router } from "express";
import {
  getCustomerCount,
  getMyActivity,
  getMyProfile,
  updateMyProfile,
  deleteMyAccount,
} from "../controllers/customerController.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";

const router = Router();

router.get("/me", authenticate, requireRole("customer"), getMyProfile);
router.put("/me", authenticate, requireRole("customer"), updateMyProfile);
router.get("/me/activity", authenticate, requireRole("customer"), getMyActivity);
router.delete("/me", authenticate, requireRole("customer"), deleteMyAccount);
router.get("/count", authenticate, requireRole("admin"), getCustomerCount);

export default router;
