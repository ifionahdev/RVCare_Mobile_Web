import { Router } from "express";
import {
  createVeterinarianSchedule,
  createVeterinarianTimeOffEntry,
  deleteVeterinarianSchedule,
  deleteVeterinarianTimeOffEntry,
  getVeterinarianSchedules,
  getVeterinarianScheduleTimeOptions,
  getVeterinarianTimeOff,
  updateVeterinarianSchedule,
  updateVeterinarianTimeOffEntry,
} from "../controllers/vetScheduleController.js";
import { requireRole } from "../middleware/role.js";

const router = Router();

router.get("/", requireRole("admin", "vet"), getVeterinarianSchedules);
router.get("/time-options", requireRole("admin"), getVeterinarianScheduleTimeOptions);
router.post("/", requireRole("admin"), createVeterinarianSchedule);
router.put("/:scheduleId", requireRole("admin"), updateVeterinarianSchedule);
router.delete("/:scheduleId", requireRole("admin"), deleteVeterinarianSchedule);
router.get("/time-off", requireRole("admin", "vet"), getVeterinarianTimeOff);
router.post("/time-off", requireRole("admin"), createVeterinarianTimeOffEntry);
router.put("/time-off/:timeOffId", requireRole("admin"), updateVeterinarianTimeOffEntry);
router.delete("/time-off/:timeOffId", requireRole("admin"), deleteVeterinarianTimeOffEntry);

export default router;
