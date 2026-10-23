import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5,
});
const prisma = new PrismaClient({ adapter });

// 1) Roles. Add new roles here.
const ROLES = [
  { role_slug: "admin", role_name: "Administrator" },
  { role_slug: "vet", role_name: "Veterinarian" },
  { role_slug: "customer", role_name: "Pet Owner" },
];

// 2) Test accounts (dev only). username = email.
const TEST_ACCOUNTS = [
  {
    username: "markmapili29@gmail.com",
    password: "AdminPass123!",
    first_name: "System",
    last_name: "Admin",
    role: "admin",
  },
  {
    username: "vet@gmail.com",
    password: "VetPass123!",
    first_name: "Test",
    last_name: "Veterinarian",
    role: "vet",
  },
  {
    username: "markmapili2004@gmail.com",
    password: "CustomerPass123!",
    first_name: "Test",
    last_name: "Customer",
    role: "customer",
  },
];

async function main() {
  // Roles first (accounts need them). upsert = skip if it already exists.
  for (const r of ROLES) {
    await prisma.role.upsert({
      where: { role_slug: r.role_slug },
      update: {},
      create: r,
    });
  }

  // Accounts, then each account's profile row.
  for (const a of TEST_ACCOUNTS) {
    const role = await prisma.role.findUniqueOrThrow({
      where: { role_slug: a.role },
    });

    const account = await prisma.account.upsert({
      where: { username: a.username },
      update: {},
      create: {
        username: a.username,
        password: await bcrypt.hash(a.password, 10),
        first_name: a.first_name,
        last_name: a.last_name,
        role_id: role.role_id,
      },
    });

    const profile = {
      where: { account_id: account.account_id },
      update: {},
      create: { account_id: account.account_id },
    };
    if (a.role === "admin") await prisma.admin.upsert(profile);
    if (a.role === "vet") await prisma.veterinarian.upsert(profile);
    if (a.role === "customer") await prisma.petOwner.upsert(profile);
  }

  console.log("Seed complete: roles + test accounts");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());