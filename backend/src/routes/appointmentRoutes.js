import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import {
  createAppointment,
  getAppointments,
  getAppointment,
  getMyAppointments,
  getPendingAppointmentsCount,
  getTodaysAppointmentsCount,
  getAppointmentPerStatusCount,
  rescheduleAppointment,
} from "../controllers/appointmentController.js";

const router = Router();

router.post("/", authenticate, requireRole("customer"), createAppointment);
router.get("/", authenticate, requireRole("admin"), getAppointments);
router.get("/me", authenticate, requireRole("customer"), getMyAppointments);
router.get("/count/pending", authenticate, requireRole("admin"), getPendingAppointmentsCount);
router.get(
  "/count/today",
  authenticate,
  requireRole("admin"),
  getTodaysAppointmentsCount,
);
router.get(
  "/count/status",
  authenticate,
  requireRole("admin"),
  getAppointmentPerStatusCount,
);
router.get(
  "/:appointmentId",
  authenticate,
  requireRole("customer", "admin"),
  getAppointment,
);
router.patch(
  "/:appointmentId/reschedule",
  authenticate,
  requireRole("customer", "admin"),
  rescheduleAppointment,
);

export default router;
