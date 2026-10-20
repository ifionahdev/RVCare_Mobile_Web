
import express from "express";
import crypto from "node:crypto";
import helmet from "helmet";
import cors from "cors";
import authRoutes from "./src/routes/authRoutes.js";
import passwordResetRoutes from "./src/routes/passwordResetRoutes.js";

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

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
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

app.use((error, req, res, next) => {
  console.error(
    `[http] ${req.requestId ?? "unknown"} ${req.method} ${req.originalUrl} failed:`,
    error.message
  );

  if (error.message === "CORS origin not allowed") {
    return res.status(403).json({
      message: "Origin not allowed.",
    });
  }

  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({
      message: "Invalid JSON request.",
    });
  }

  console.error(error);

  return res.status(500).json({
    message: "An unexpected server error occurred.",
  });
});

export default app;
