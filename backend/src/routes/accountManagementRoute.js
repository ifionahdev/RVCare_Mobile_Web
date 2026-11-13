import { Router } from "express";
import {
  createManagedStaffAccount,
  deleteManagedStaffAccount,
  getManagedStaffAccounts,
  updateManagedStaffAccount,
} from "../controllers/accountManagementController.js";

const router = Router();

router.get("/users", getManagedStaffAccounts);
router.post("/users", createManagedStaffAccount);
router.put("/users/:accountId", updateManagedStaffAccount);
router.delete("/users/:accountId", deleteManagedStaffAccount);

export default router;
