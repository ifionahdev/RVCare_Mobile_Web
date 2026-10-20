
import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
  forgotPassword,
  resetPassword,
  verifyResetCode,
} from "../controllers/passwordResetController.js";

const router = Router();

const requestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    message: "Too many requests. Please try again later.",
  },
});

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    message: "Too many attempts. Please try again later.",
  },
});

router.post("/forgot-password", requestLimiter, forgotPassword);
router.post("/verify-reset-code", resetLimiter, verifyResetCode);
router.post("/reset-password", resetLimiter, resetPassword);

export default router;
