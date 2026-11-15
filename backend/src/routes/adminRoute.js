import { Router } from "express";
import {
  addOwner,
  getBreeds,
  getOwnersWithPets,
  getSpecies,
  softDeleteOwner,
  softDeletePet,
  addPet,
  updatePet,
  updateOwner,
  getAdminAppointments,
  getAppointmentOwners,
  getAppointmentTimes,
  getBookedSlots,
  getAppointmentServices,
  assignAppointment,
  makeVisit,
  updateAppointmentStatuses,
  softDeleteAppointments,
} from "../controllers/adminController.js";
import { getReports, exportReportsCsv } from "../controllers/reportsController.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import vetScheduleRoutes from "./vetScheduleRoute.js";
import accountManagementRoutes from "./accountManagementRoute.js";
import auditLogRoutes from "./auditLogRoute.js";

const router = Router();

router.use(authenticate);
router.use("/vet-schedules", vetScheduleRoutes);
router.use("/settings", requireRole("admin"), accountManagementRoutes);
router.use("/audit-logs", requireRole("admin"), auditLogRoutes);
router.get("/owners-with-pets", requireRole("admin", "vet"), getOwnersWithPets);
router.post("/add-owner", requireRole("admin"), addOwner);
router.put("/update-owner/:accountId", requireRole("admin"), updateOwner);
router.get("/breeds", requireRole("admin"), getBreeds);
router.get("/species", requireRole("admin"), getSpecies);
router.post("/add-pets", requireRole("admin"), addPet);
router.put("/update-pet/:petId", requireRole("admin"), updatePet);
router.put("/soft-delete-owner/:accountId", requireRole("admin"), softDeleteOwner);
router.put("/soft-delete-pet/:petId", requireRole("admin"), softDeletePet);
router.get("/appointments", requireRole("admin", "vet"), getAdminAppointments);
router.get("/appointments/owners", requireRole("admin"), getAppointmentOwners);
router.get("/appointments/time", requireRole("admin"), getAppointmentTimes);
router.get("/appointments/booked-slots", requireRole("admin"), getBookedSlots);
router.get("/appointments/services", requireRole("admin"), getAppointmentServices);
router.post("/appointments/assign", requireRole("admin"), assignAppointment);
router.post("/appointments/make-visit", requireRole("admin"), makeVisit);
router.patch("/appointments/status", requireRole("admin"), updateAppointmentStatuses);
router.delete("/appointments", requireRole("admin"), softDeleteAppointments);
router.get("/reports", requireRole("admin"), getReports);
router.get("/reports/export-csv", requireRole("admin"), exportReportsCsv);

export default router;
