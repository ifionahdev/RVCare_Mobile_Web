
import "dotenv/config";
import app from "./app.js";
import pool from "./src/config/db.js";
import http from "node:http";
import { initializeRealtime } from "./src/realtime.js";

const port = Number(process.env.PORT ?? 5000);

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error(
    "JWT_SECRET must be configured with at least 32 characters."
  );
}

try {
  await pool.query("SELECT 1");

  console.log("Database connection successful.");

  const server = http.createServer(app);
  initializeRealtime(server);

  server.listen(port, "0.0.0.0", () => {
    console.log(`RaphaCare API listening on port ${port}`);
  });
} catch (error) {
  console.error("Failed to start RaphaCare API:", error, error.message);
  process.exit(1);
}
