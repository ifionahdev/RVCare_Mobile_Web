
import mysql from "mysql2/promise";
import "dotenv/config";
import { getDatabaseConfig } from "./databaseConfig.js";

const database = getDatabaseConfig();

const pool = mysql.createPool({
  ...database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
