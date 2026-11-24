import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.ts";
import { getDatabaseConfig } from "./databaseConfig.js";

const adapter = new PrismaMariaDb({
  ...getDatabaseConfig(),
  connectionLimit: 10,
});

export const prisma = new PrismaClient({ adapter });