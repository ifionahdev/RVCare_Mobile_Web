import { Router } from "express";
import {
  createLabResult,
  createMedicalHistory,
  deleteLabResult,
  deleteMedicalHistory,
  downloadRecordAttachment,
  getRecordsWorkspace,
  updateLabResult,
  updateMedicalHistory,
  uploadRecordAttachment,
} from "../controllers/recordsController.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";

const router = Router();

router.use(authenticate);
router.get("/workspace", requireRole("admin", "vet"), getRecordsWorkspace);
router.get("/attachments/:attachmentId", requireRole("admin", "vet"), downloadRecordAttachment);
router.post(
  "/medical-histories",
requireRole("admin", "vet"),
  uploadRecordAttachment,
  createMedicalHistory,
);
router.put(
  "/medical-histories/:historyId",
  requireRole("admin", "vet"),
  uploadRecordAttachment,
  updateMedicalHistory,
);
router.delete("/medical-histories/:historyId", requireRole("admin", "vet"), deleteMedicalHistory);
router.post("/lab-results", requireRole("admin", "vet"), uploadRecordAttachment, createLabResult);
router.put("/lab-results/:labResultId", requireRole("admin", "vet"), uploadRecordAttachment, updateLabResult);
router.delete("/lab-results/:labResultId", requireRole("admin", "vet"), deleteLabResult);

export default router;
