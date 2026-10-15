
import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { login, me } from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Too many login attempts. Please try again in 15 minutes.",
  },
});

router.post("/login", loginLimiter, login);
router.get("/me", authenticate, me);

export default router;
