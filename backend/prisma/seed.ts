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

const VETERINARIAN_SCHEDULE_SEEDS = [
  { username: "vet@gmail.com", days: [1, 2, 3, 4, 5], startTime: "08:00", endTime: "17:00" },
  { username: "vet2@gmail.com", days: [1, 2, 3, 4, 5], startTime: "09:00", endTime: "18:00" },
  { username: "vet3@gmail.com", days: [1, 2, 3, 4, 5], startTime: "08:00", endTime: "16:00" },
  { username: "vet4@gmail.com", days: [1, 2, 3, 4, 5], startTime: "10:00", endTime: "19:00" },
] as const;

// 3) Timeslots: 08:00-09:00 up to 19:00-20:00 (12 hourly slots)
const pad = (h: number) => String(h).padStart(2, "0");
const hourLabel = (h: number) =>
  `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? "AM" : "PM"}`;

const TIMESLOTS = Array.from({ length: 12 }, (_, i) => {
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

const dateOnly = (year: number, month: number, day: number) =>
  new Date(Date.UTC(year, month - 1, day));

const futureDateOnly = (daysAhead: number) => {
  const manilaToday = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
  const date = new Date(`${manilaToday}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + daysAhead);
  return date;
};

async function seedVeterinarianSchedules(adminAccountId: number) {
  for (const seed of VETERINARIAN_SCHEDULE_SEEDS) {
    const account = await prisma.account.findUniqueOrThrow({
      where: { username: seed.username },
      include: { veterinarian: true },
    });
    const veterinarian = account.veterinarian;
    if (!veterinarian) {
      throw new Error(`Veterinarian profile is missing for ${seed.username}`);
    }

    for (const dayOfWeek of seed.days) {
      const existing = await prisma.veterinarianSchedule.findFirst({
        where: { vetId: veterinarian.vetId, dayOfWeek },
      });
      const data = {
        vetId: veterinarian.vetId,
        dayOfWeek,
        startTime: seed.startTime,
        endTime: seed.endTime,
        note: null,
        assignerId: adminAccountId,
        isDeleted: false,
      };

      if (existing) {
        await prisma.veterinarianSchedule.update({
          where: { scheduleId: existing.scheduleId },
          data,
        });
      } else {
        await prisma.veterinarianSchedule.create({ data });
      }
    }
  }

  const firstVet = await prisma.account.findUniqueOrThrow({
    where: { username: VETERINARIAN_SCHEDULE_SEEDS[0].username },
    include: { veterinarian: true },
  });
  const vetId = firstVet.veterinarian?.vetId;
  if (!vetId) throw new Error("Sample veterinarian profile is missing.");

  const existingTimeOff = await prisma.veterinarianTimeOff.findFirst({
    where: { vetId, reason: "Seeded training session" },
  });
  const timeOffData = {
    vetId,
    date: futureDateOnly(14),
    startTime: "13:00",
    endTime: "15:00",
    status: "Pending" as const,
    reason: "Seeded training session",
    note: "Sample time-off request for schedule management.",
    reviewerId: adminAccountId,
    isDeleted: false,
  };

  if (existingTimeOff) {
    await prisma.veterinarianTimeOff.update({
      where: { timeOffId: existingTimeOff.timeOffId },
      data: timeOffData,
    });
  } else {
    await prisma.veterinarianTimeOff.create({ data: timeOffData });
  }
}

// 6) Pets for the test customer: one cat, one dog
const TEST_PETS = [
  {
    petName: "Whiskers",
    gender: "Female",
    species: "Cat",
    breedName: "Puspin",
    dateOfBirth: dateOnly(2020, 1, 1),
  },
  {
    petName: "Buddy",
    gender: "Male",
    species: "Dog",
    breedName: "Aspin",
    dateOfBirth: dateOnly(2019, 6, 15),
  },
] as const;

const RECORD_TEST_TYPES = [
  {
    code: "CBC",
    name: "Complete blood count",
    parameters: [
      { name: "Hemoglobin", unit: "g/dL", refRangeText: "12.0-18.0", displayOrder: 1 },
      { name: "White blood cells", unit: "10^3/uL", refRangeText: "6.0-17.0", displayOrder: 2 },
      { name: "Red blood cells", unit: "10^6/uL", refRangeText: "5.5-8.5", displayOrder: 3 },
      { name: "Platelets", unit: "10^3/uL", refRangeText: "200-500", displayOrder: 4 },
    ],
  },
  {
    code: "UA",
    name: "Urinalysis",
    parameters: [
      { name: "Specific gravity", unit: "", refRangeText: "1.015-1.045", displayOrder: 1 },
      { name: "pH", unit: "", refRangeText: "5.5-7.5", displayOrder: 2 },
      { name: "Protein", unit: "", refRangeText: "Negative", displayOrder: 3 },
    ],
  },
] as const;

const RECORD_SEEDS = [
  {
    petName: "Whiskers",
    vetUsername: "vet@gmail.com",
    serviceName: "Check-up",
    date: dateOnly(2026, 10, 28),
    time: new Date(Date.UTC(2026, 9, 28, 10, 15)),
    visitType: "Walk_in" as const,
    history: {
      weightKg: 4.75,
      temperature: 38.6,
      heartRate: 118,
      findings: "Routine wellness exam; alert and responsive with normal hydration.",
      assessment: "Clinically stable. No acute concerns identified.",
      treatmentPlan: "Continue current diet and routine preventive care.",
      instructions: "Return for an annual wellness examination or sooner if symptoms develop.",
    },
    lab: {
      code: "CBC",
      interpretation: "Values are within the expected reference ranges.",
      values: [
        { name: "Hemoglobin", value: 14.5, textValue: null },
        { name: "White blood cells", value: 9.8, textValue: null },
        { name: "Red blood cells", value: 6.4, textValue: null },
        { name: "Platelets", value: 285, textValue: null },
      ],
    },
  },
  {
    petName: "Buddy",
    vetUsername: "vet2@gmail.com",
    serviceName: "Check-up",
    date: dateOnly(2026, 10, 30),
    time: new Date(Date.UTC(2026, 9, 30, 11, 0)),
    visitType: "Walk_in" as const,
    history: {
      weightKg: 12.4,
      temperature: 38.8,
      heartRate: 104,
      findings: "Owner reports increased thirst; patient is bright and comfortable.",
      assessment: "Mildly increased thirst. Urinalysis requested for screening.",
      treatmentPlan: "Collect a fresh urine sample and review results with the owner.",
      instructions: "Ensure fresh water is available and monitor drinking and urination.",
    },
    lab: {
      code: "UA",
      interpretation: "Screening values are unremarkable; correlate with clinical signs.",
      values: [
        { name: "Specific gravity", value: 1.03, textValue: null },
        { name: "pH", value: 6.5, textValue: null },
        { name: "Protein", value: null, textValue: "Negative" },
      ],
    },
  },
] as const;

//FAKER SEEDING FUNCTIONS
const FAKE_OWNERS = 15;
const FAKE_APPOINTMENTS = 60;

const toDateOnly = (d: Date) =>
  new Date(`${d.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" })}T00:00:00.000Z`);

async function seedRecords(ownerId: number) {
  const testTypes = new Map<string, number>();

  for (const testTypeSeed of RECORD_TEST_TYPES) {
    const testType = await prisma.labTestType.upsert({
      where: { code: testTypeSeed.code },
      update: { name: testTypeSeed.name, isActive: true, isDeleted: false },
      create: {
        code: testTypeSeed.code,
        name: testTypeSeed.name,
        isActive: true,
        isDeleted: false,
      },
    });
    testTypes.set(testType.code, testType.testTypeId);

    for (const parameterSeed of testTypeSeed.parameters) {
      const current = await prisma.labTestParameter.findFirst({
        where: { testTypeId: testType.testTypeId, name: parameterSeed.name },
      });
      const data = {
        testTypeId: testType.testTypeId,
        name: parameterSeed.name,
        unit: parameterSeed.unit || null,
        refRangeText: parameterSeed.refRangeText,
        displayOrder: parameterSeed.displayOrder,
        isDeleted: false,
      };
      if (current) {
        await prisma.labTestParameter.update({
          where: { parameterId: current.parameterId },
          data,
        });
      } else {
        await prisma.labTestParameter.create({ data });
      }
    }
  }

  for (const seed of RECORD_SEEDS) {
    const pet = await prisma.pet.findFirstOrThrow({
      where: { ownerId, petName: seed.petName, isDeleted: false },
    });
    const veterinarianAccount = await prisma.account.findUniqueOrThrow({
      where: { username: seed.vetUsername },
      include: { veterinarian: true },
    });
    if (!veterinarianAccount.veterinarian) {
      throw new Error(`Veterinarian profile is missing for ${seed.vetUsername}`);
    }
    const service = await prisma.service.findFirstOrThrow({
      where: { serviceName: seed.serviceName },
    });

    const visitData = {
      vetId: veterinarianAccount.veterinarian.vetId,
      petId: pet.petId,
      serviceId: service.serviceId,
      visitType: seed.visitType,
      visitDate: seed.date,
      visitTime: seed.time,
      status: "Completed" as const,
      isDeleted: false,
    };
    const currentVisit = await prisma.visit.findFirst({
      where: {
        vetId: visitData.vetId,
        petId: visitData.petId,
        serviceId: visitData.serviceId,
        visitDate: visitData.visitDate,
        visitType: visitData.visitType,
      },
    });
    const visit = currentVisit
      ? await prisma.visit.update({
          where: { visitId: currentVisit.visitId },
          data: visitData,
        })
      : await prisma.visit.create({ data: visitData });

    const historyData = {
      visitId: visit.visitId,
      weightKg: seed.history.weightKg,
      temperature: seed.history.temperature,
      heartRate: seed.history.heartRate,
      findings: seed.history.findings,
      assessment: seed.history.assessment,
      treatmentPlan: seed.history.treatmentPlan,
      instructions: seed.history.instructions,
    };
    const currentHistory = await prisma.medicalHistory.findFirst({
      where: { visitId: visit.visitId },
    });
    if (currentHistory) {
      await prisma.medicalHistory.update({
        where: { historyId: currentHistory.historyId },
        data: historyData,
      });
    } else {
      await prisma.medicalHistory.create({ data: historyData });
    }

    const testTypeId = testTypes.get(seed.lab.code);
    if (!testTypeId) throw new Error(`Lab test type ${seed.lab.code} was not seeded.`);
    const currentLabResult = await prisma.labResult.findFirst({
      where: { visitId: visit.visitId, testTypeId },
    });
    const labResult = currentLabResult
      ? await prisma.labResult.update({
          where: { labResultId: currentLabResult.labResultId },
          data: { interpretation: seed.lab.interpretation, createdAt: seed.date },
        })
      : await prisma.labResult.create({
          data: {
            visitId: visit.visitId,
            testTypeId,
            interpretation: seed.lab.interpretation,
            createdAt: seed.date,
          },
        });

    for (const valueSeed of seed.lab.values) {
      const parameter = await prisma.labTestParameter.findFirstOrThrow({
        where: { testTypeId, name: valueSeed.name, isDeleted: false },
      });
      const currentValue = await prisma.labResultValue.findFirst({
        where: { labResultId: labResult.labResultId, parameterId: parameter.parameterId },
      });
      const valueData = {
        labResultId: labResult.labResultId,
        parameterId: parameter.parameterId,
        value: valueSeed.value,
        textValue: valueSeed.textValue,
        isDeleted: false,
      };
      if (currentValue) {
        await prisma.labResultValue.update({
          where: { valueId: currentValue.valueId },
          data: valueData,
        });
      } else {
        await prisma.labResultValue.create({ data: valueData });
      }
    }
  }
}

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
        email: `fakeowner${i}@example.com`,
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
            dateOfBirth: dateOnly(2020, 1, 1),
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
      update: {
        email: a.username,
        password: await bcrypt.hash(a.password, 10),
        firstName: a.firstName,
        lastName: a.lastName,
        roleId: role.roleId,
      },
      create: {
        username: a.username,
        email: a.username,
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
    if (exists) {
      await prisma.pet.update({
        where: { petId: exists.petId },
        data: {
          breedId: breed.breedId,
          gender: p.gender,
          dateOfBirth: p.dateOfBirth,
          isDeleted: false,
        },
      });
    } else {
      await prisma.pet.create({
        data: {
          ownerId: customerOwnerId,
          petName: p.petName,
          gender: p.gender,
          breedId: breed.breedId,
          dateOfBirth: p.dateOfBirth,
        },
      });
    }
  }

  const adminAccount = await prisma.account.findUniqueOrThrow({
    where: { username: "markmapili29@gmail.com" },
  });

  await seedVeterinarianSchedules(adminAccount.accountId);
  await seedRecords(customerOwnerId);

  const publicationStatuses = ["Draft", "Published", "Archived"] as const;
  for (const statusName of publicationStatuses) {
    await prisma.publicationStatus.upsert({
      where: { statusName },
      update: {},
      create: { statusName },
    });
  }

  const petCareCategories = ["Health", "Nutrition", "Grooming", "Training", "Behavior"];
  for (const categoryName of petCareCategories) {
    await prisma.petCareCategory.upsert({
      where: { categoryName },
      update: { isDeleted: false },
      create: { categoryName },
    });
  }

  const icons = [
    ["Health", "heart"],
    ["Nutrition", "utensils"],
    ["Grooming", "scissors"],
    ["Exercise", "activity"],
    ["Training", "puzzle"],
    ["Bath", "bath"],
  ] as const;
  for (const [iconName, iconKey] of icons) {
    await prisma.petCareIcon.upsert({
      where: { iconName },
      update: { iconKey },
      create: { iconName, iconKey },
    });
  }

  const videoCategories = ["Education", "Health", "Grooming", "Nutrition"];
  for (const categoryName of videoCategories) {
    await prisma.videoCategory.upsert({
      where: { categoryName },
      update: { isDeleted: false },
      create: { categoryName },
    });
  }

  const publishedStatus = await prisma.publicationStatus.findUniqueOrThrow({
    where: { statusName: "Published" },
  });
  const draftStatus = await prisma.publicationStatus.findUniqueOrThrow({
    where: { statusName: "Draft" },
  });
  const healthCategory = await prisma.petCareCategory.findUniqueOrThrow({
    where: { categoryName: "Health" },
  });
  const groomingCategory = await prisma.petCareCategory.findUniqueOrThrow({
    where: { categoryName: "Grooming" },
  });
  const healthIcon = await prisma.petCareIcon.findUniqueOrThrow({
    where: { iconName: "Health" },
  });
  const groomingIcon = await prisma.petCareIcon.findUniqueOrThrow({
    where: { iconName: "Grooming" },
  });

  const articleSeeds = [
    {
      title: "Keep Your Pet Hydrated",
      shortDescription: "Make sure your pet always has access to clean, fresh water.",
      detailedContent: "Refresh your pet's water daily and clean bowls regularly to encourage healthy hydration.",
      iconId: healthIcon.iconId,
      contentCategoryId: healthCategory.categoryId,
      publicationStatusId: publishedStatus.statusId,
    },
    {
      title: "A Simple Grooming Routine",
      shortDescription: "Create a gentle brushing routine suited to your pet's coat.",
      detailedContent: "Brush regularly, check the ears and paws, and use pet-safe grooming products.",
      iconId: groomingIcon.iconId,
      contentCategoryId: groomingCategory.categoryId,
      publicationStatusId: draftStatus.statusId,
    },
  ] as const;

  for (const article of articleSeeds) {
    const exists = await prisma.petCareTip.findFirst({
      where: { title: article.title, type: "Article" },
    });
    if (!exists) {
      await prisma.petCareTip.create({
        data: {
          type: "Article",
          title: article.title,
          linkUrl: "",
          uploaderAccountId: adminAccount.accountId,
          shortDescription: article.shortDescription,
          detailedContent: article.detailedContent,
          iconId: article.iconId,
          contentCategoryId: article.contentCategoryId,
          publicationStatusId: article.publicationStatusId,
        },
      });
    }
  }

  const educationCategory = await prisma.videoCategory.findUniqueOrThrow({
    where: { categoryName: "Education" },
  });
  const videoSeeds = [
    ["Understanding Your Pet's Body Language", "https://www.youtube.com/watch?v=example-pet-body-language"],
    ["At-Home Pet Grooming Basics", "https://www.youtube.com/watch?v=example-pet-grooming"],
  ];
  for (const [title, videoUrl] of videoSeeds) {
    const exists = await prisma.contentVideo.findFirst({ where: { title } });
    if (!exists) {
      await prisma.contentVideo.create({
        data: {
          title,
          videoUrl,
          categoryId: educationCategory.videoCategoryId,
          publicationStatusId: publishedStatus.statusId,
          uploaderAccountId: adminAccount.accountId,
        },
      });
    }
  }

  if (process.env.SEED_FAKE === "true") {
    console.log("Seeding fake data...");
    await seedFakeData();
  }

  console.log(
    "Seed complete: roles, accounts, schedules, time off, timeslots, services, breeds, pets, records, content",
  );
}


main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());