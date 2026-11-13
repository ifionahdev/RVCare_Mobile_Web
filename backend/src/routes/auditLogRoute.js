import { Router } from "express";
import {
  getAuditLogFilters,
  getAuditLogs,
} from "../controllers/auditLogController.js";

const router = Router();

router.get("/filters", getAuditLogFilters);
router.get("/", getAuditLogs);

export default router;
