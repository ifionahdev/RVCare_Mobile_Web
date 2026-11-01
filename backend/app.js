
import express from "express";
import crypto from "node:crypto";
import helmet from "helmet";
import cors from "cors";
import authRoutes from "./src/routes/authRoutes.js";
import passwordResetRoutes from "./src/routes/passwordResetRoutes.js";
import petRoutes from "./src/routes/petRoutes.js";
import serviceRoutes from "./src/routes/serviceRoute.js";
import availabilityRoutes from "./src/routes/availabilityRoute.js";
import vetRoutes from "./src/routes/vetRoute.js";
import appointmentRoutes from "./src/routes/appointmentRoutes.js";
import customerRoutes from "./src/routes/customerRoute.js";
import { errorHandler } from "./src/middleware/errorHandler.js";

const app = express();

app.use((req, res, next) => {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();

  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);
  console.log(
    `[http] ${requestId} ${req.method} ${req.originalUrl} from ${req.ip}`
  );

  res.on("finish", () => {
    console.log(
      `[http] ${requestId} ${req.method} ${req.originalUrl} -> ${res.statusCode} in ${Date.now() - startedAt}ms`
    );
  });

  next();
});

const allowedOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const isProduction = process.env.NODE_ENV === "production";

function isAllowedOrigin(origin) {
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  if (isProduction) {
    return false;
  }

  try {
    const url = new URL(origin);
    return (
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    );
  } catch {
    return false;
  }
}

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin not allowed"));
    },
  })
);

app.use(express.json({ limit: "16kb" }));

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "RaphaCare API",
  });
});

app.use("/api/auth", passwordResetRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/pets", petRoutes);

app.use("/api/services", serviceRoutes);

app.use("/api/availability", availabilityRoutes);

app.use("/api/vets", vetRoutes);

app.use("/api/appointments", appointmentRoutes);

app.use("/api/customers", customerRoutes);

app.use(errorHandler);

export default app;
