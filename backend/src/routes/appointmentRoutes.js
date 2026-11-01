import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import {
  createAppointment,
  getAppointments,
  getAppointment,
  rescheduleAppointment,
} from "../controllers/appointmentController.js";

const router = Router();

router.post("/", authenticate, createAppointment);
router.get("/", authenticate, getAppointments);
router.get("/:appointmentId", authenticate, getAppointment);
router.patch("/:appointmentId/reschedule", authenticate, rescheduleAppointment);

export default router;
