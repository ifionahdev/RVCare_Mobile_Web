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

const router = Router();

router.get("/", getVeterinarianSchedules);
router.get("/time-options", getVeterinarianScheduleTimeOptions);
router.post("/", createVeterinarianSchedule);
router.put("/:scheduleId", updateVeterinarianSchedule);
router.delete("/:scheduleId", deleteVeterinarianSchedule);
router.get("/time-off", getVeterinarianTimeOff);
router.post("/time-off", createVeterinarianTimeOffEntry);
router.put("/time-off/:timeOffId", updateVeterinarianTimeOffEntry);
router.delete("/time-off/:timeOffId", deleteVeterinarianTimeOffEntry);

export default router;
