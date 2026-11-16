import { Router } from "express";
import {
  getCustomerCount,
  getMyActivity,
  getMyProfile,
  getMyNotificationPreferences,
  updateMyProfile,
  updateMyNotificationPreferences,
  deleteMyAccount,
} from "../controllers/customerController.js";
import {
  getMyNotifications,
  markMyNotificationRead,
  markMyNotificationsRead,
} from "../controllers/notificationController.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";

const router = Router();

router.get("/me", authenticate, requireRole("customer"), getMyProfile);
router.put("/me", authenticate, requireRole("customer"), updateMyProfile);
router.get("/me/activity", authenticate, requireRole("customer"), getMyActivity);
router.get(
  "/me/notification-preferences",
  authenticate,
  requireRole("customer"),
  getMyNotificationPreferences,
);
router.put(
  "/me/notification-preferences",
  authenticate,
  requireRole("customer"),
  updateMyNotificationPreferences,
);
router.get(
  "/me/notifications",
  authenticate,
  requireRole("customer"),
  getMyNotifications,
);
router.patch(
  "/me/notifications/read-all",
  authenticate,
  requireRole("customer"),
  markMyNotificationsRead,
);
router.patch(
  "/me/notifications/:notificationId/read",
  authenticate,
  requireRole("customer"),
  markMyNotificationRead,
);
router.delete("/me", authenticate, requireRole("customer"), deleteMyAccount);
router.get("/count", authenticate, requireRole("admin"), getCustomerCount);

export default router;
