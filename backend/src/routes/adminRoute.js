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
import { getReports, exportReportsPdf } from "../controllers/reportsController.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import vetScheduleRoutes from "./vetScheduleRoute.js";
import accountManagementRoutes from "./accountManagementRoute.js";
import auditLogRoutes from "./auditLogRoute.js";

const router = Router();

router.use(authenticate, requireRole("admin"));
router.use("/vet-schedules", vetScheduleRoutes);
router.use("/settings", accountManagementRoutes);
router.use("/audit-logs", auditLogRoutes);
router.get("/owners-with-pets", getOwnersWithPets);
router.post("/add-owner", addOwner);
router.put("/update-owner/:accountId", updateOwner);
router.get("/breeds", getBreeds);
router.get("/species", getSpecies);
router.post("/add-pets", addPet);
router.put("/update-pet/:petId", updatePet);
router.put("/soft-delete-owner/:accountId", softDeleteOwner);
router.put("/soft-delete-pet/:petId", softDeletePet);
router.get("/appointments", getAdminAppointments);
router.get("/appointments/owners", getAppointmentOwners);
router.get("/appointments/time", getAppointmentTimes);
router.get("/appointments/booked-slots", getBookedSlots);
router.get("/appointments/services", getAppointmentServices);
router.post("/appointments/assign", assignAppointment);
router.post("/appointments/make-visit", makeVisit);
router.patch("/appointments/status", updateAppointmentStatuses);
router.delete("/appointments", softDeleteAppointments);
router.get("/reports", getReports);
router.post("/reports/export-pdf", exportReportsPdf);

export default router;
