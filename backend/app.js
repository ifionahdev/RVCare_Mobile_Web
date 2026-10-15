
import express from "express";
import helmet from "helmet";
import cors from "cors";
import authRoutes from "./src/routes/authRoutes.js";

const app = express();

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

app.use("/api/auth", authRoutes);

app.use((error, req, res, next) => {
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
