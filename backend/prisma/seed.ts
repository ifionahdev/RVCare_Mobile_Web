import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { faker } from "@faker-js/faker";

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
  { roleSlug: "admin", roleName: "Administrator" },
  { roleSlug: "vet", roleName: "Veterinarian" },
  { roleSlug: "customer", roleName: "Pet Owner" },
];

// 2) Test accounts (dev only). username = email.
const TEST_ACCOUNTS = [
  {
    username: "markmapili29@gmail.com",
    password: "AdminPass123!",
    firstName: "System",
    lastName: "Admin",
    role: "admin",
  },
  {
    username: "vet@gmail.com",
    password: "VetPass123!",
    firstName: "Test",
    lastName: "Veterinarian",
    role: "vet",
  },
  {
    username: "vet2@gmail.com",
    password: "VetPass123!",
    firstName: "Allan",
    lastName: "Mercer",
    role: "vet",
  },
  {
    username: "vet3@gmail.com",
    password: "VetPass123!",
    firstName: "Sabine",
    lastName: "Callas",
    role: "vet",
  },
  {
    username: "vet4@gmail.com",
    password: "VetPass123!",
    firstName: "Selena",
    lastName: "Woods",
    role: "vet",
  },
  {
    username: "markmapili2004@gmail.com",
    password: "CustomerPass123!",
    firstName: "Test",
    lastName: "Customer",
    role: "customer",
  },
];

// 3) Timeslots: 08:00-09:00 up to 20:00-21:00 (13 hourly slots)
const pad = (h: number) => String(h).padStart(2, "0");
const hourLabel = (h: number) =>
  `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? "AM" : "PM"}`;

const TIMESLOTS = Array.from({ length: 13 }, (_, i) => {
  const h = 8 + i;
  return {
    startTime: `${pad(h)}:00`,
    endTime: `${pad(h + 1)}:00`,
    display: `${hourLabel(h)} - ${hourLabel(h + 1)}`, // "8AM - 9AM" ... "8PM - 9PM"
  };
});

// 4) Services
const SERVICES = ["Check-up", "Vaccination", "Surgery", "Grooming"];

// 5) Breeds (pets need a breedId)
const BREEDS = [
  { species: "Cat", breedName: "Puspin" },
  { species: "Cat", breedName: "Persian" },
  { species: "Dog", breedName: "Aspin" },
  { species: "Dog", breedName: "Shih Tzu" },
] as const;

// 6) Pets for the test customer: one cat, one dog
const TEST_PETS = [
  { petName: "Whiskers", gender: "Female", species: "Cat", breedName: "Puspin" },
  { petName: "Buddy", gender: "Male", species: "Dog", breedName: "Aspin" },
] as const;

//FAKER SEEDING FUNCTIONS
const FAKE_OWNERS = 15;
const FAKE_APPOINTMENTS = 60;

const toDateOnly = (d: Date) =>
  new Date(`${d.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" })}T00:00:00.000Z`);

async function seedFakeData() {
  faker.seed(42); // same data every run; remove for random data

  const customerRole = await prisma.role.findUniqueOrThrow({ where: { roleSlug: "customer" } });
  const breeds = await prisma.petBreed.findMany();
  const services = await prisma.service.findMany();
  const timeslots = await prisma.timeslot.findMany();
  const vets = await prisma.veterinarian.findMany();
  const passwordHash = await bcrypt.hash("CustomerPass123!", 10); // hash once, not per user

  // Owners + pets
  const pets: { petId: number }[] = [];
  for (let i = 1; i <= FAKE_OWNERS; i++) {
    const account = await prisma.account.upsert({
      where: { username: `fakeowner${i}@example.com` },
      update: {},
      create: {
        username: `fakeowner${i}@example.com`,
        password: passwordHash,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        roleId: customerRole.roleId,
      },
    });
    const owner = await prisma.petOwner.upsert({
      where: { accountId: account.accountId },
      update: {},
      create: {
        accountId: account.accountId,
        address: faker.location.streetAddress().slice(0, 100),
        contactNumber: `09${faker.string.numeric(9)}`, // 11 chars max
      },
    });
    for (let p = 0; p < faker.number.int({ min: 1, max: 3 }); p++) {
      pets.push(
        await prisma.pet.create({
          data: {
            ownerId: owner.ownerId,
            petName: faker.person.firstName(),
            gender: faker.helpers.arrayElement(["Male", "Female"] as const),
            breedId: faker.helpers.arrayElement(breeds).breedId,
          },
        }),
      );
    }
  }

  // Appointments (+ visits for completed ones), never reusing a vet/date/slot
  const taken = new Set<string>();
  for (let i = 0; i < FAKE_APPOINTMENTS; i++) {
    const offset = faker.number.int({ min: -14, max: 14 });
    const when = new Date(Date.now() + offset * 86_400_000);
    const scheduledDate = toDateOnly(when);
    const vet = faker.helpers.arrayElement(vets);
    const slot = faker.helpers.arrayElement(timeslots);
    const key = `${vet.vetId}-${scheduledDate.toISOString()}-${slot.timeslotId}`;
    if (taken.has(key)) continue;
    taken.add(key);

    const status =
      offset < 0
        ? faker.helpers.arrayElement(["Completed", "Completed", "Missed", "Cancelled"] as const)
        : faker.helpers.arrayElement(["Pending", "Upcoming", "Upcoming", "Rejected"] as const);

    const petId = faker.helpers.arrayElement(pets).petId;
    const serviceId = faker.helpers.arrayElement(services).serviceId;

    const appt = await prisma.appointment.create({
      data: { vetId: vet.vetId, petId, serviceId, scheduledDate, timeslotId: slot.timeslotId, status },
    });

    if (status === "Completed") {
      await prisma.visit.create({
        data: {
          appointmentId: appt.appointmentId,
          vetId: vet.vetId,
          petId,
          serviceId,
          visitDate: scheduledDate,
          status: "Completed",
        },
      });
    }
  }

  // A few walk-in visits (no appointment)
  for (let i = 0; i < 5; i++) {
    await prisma.visit.create({
      data: {
        vetId: faker.helpers.arrayElement(vets).vetId,
        petId: faker.helpers.arrayElement(pets).petId,
        serviceId: faker.helpers.arrayElement(services).serviceId,
        status: faker.helpers.arrayElement(["Checked_in", "Ongoing"] as const),
      },
    });
  }
}

async function main() {
  // Roles first (accounts need them). upsert = skip if it already exists.
  for (const r of ROLES) {
    await prisma.role.upsert({
      where: { roleSlug: r.roleSlug },
      update: {},
      create: r,
    });
  }

  // Accounts, then each account's profile row.
  let customerOwnerId: number | undefined;

  for (const a of TEST_ACCOUNTS) {
    const role = await prisma.role.findUniqueOrThrow({
      where: { roleSlug: a.role },
    });

    const account = await prisma.account.upsert({
      where: { username: a.username },
      update: {},
      create: {
        username: a.username,
        password: await bcrypt.hash(a.password, 10),
        firstName: a.firstName,
        lastName: a.lastName,
        roleId: role.roleId,
      },
    });

    const profile = {
      where: { accountId: account.accountId },
      update: {},
      create: { accountId: account.accountId },
    };
    if (a.role === "admin") await prisma.admin.upsert(profile);
    if (a.role === "vet") await prisma.veterinarian.upsert(profile);
    if (a.role === "customer") {
      const owner = await prisma.petOwner.upsert(profile);
      customerOwnerId = owner.ownerId;
    }
  }

  // Timeslots (no unique key, so check before create to keep reseeding safe)
  for (const t of TIMESLOTS) {
    const exists = await prisma.timeslot.findFirst({
      where: { startTime: t.startTime, endTime: t.endTime },
    });
    if (!exists) await prisma.timeslot.create({ data: t });
  }

  // Services
  for (const serviceName of SERVICES) {
    const exists = await prisma.service.findFirst({ where: { serviceName } });
    if (!exists) await prisma.service.create({ data: { serviceName } });
  }

  // Breeds
  for (const b of BREEDS) {
    const exists = await prisma.petBreed.findFirst({
      where: { species: b.species, breedName: b.breedName },
    });
    if (!exists) await prisma.petBreed.create({ data: b });
  }

  // Pets for the test customer
  if (customerOwnerId === undefined) {
    throw new Error("Test customer was not seeded; cannot create pets");
  }

  for (const p of TEST_PETS) {
    const breed = await prisma.petBreed.findFirstOrThrow({
      where: { species: p.species, breedName: p.breedName },
    });

    const exists = await prisma.pet.findFirst({
      where: { ownerId: customerOwnerId, petName: p.petName },
    });
    if (!exists) {
      await prisma.pet.create({
        data: {
          ownerId: customerOwnerId,
          petName: p.petName,
          gender: p.gender,
          breedId: breed.breedId,
        },
      });
    }
  }

  if (process.env.SEED_FAKE === "true") {
    console.log("Seeding fake data...");
    await seedFakeData();
  }

  console.log(
    "Seed complete: roles, accounts, timeslots, services, breeds, pets",
  );
}


main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());