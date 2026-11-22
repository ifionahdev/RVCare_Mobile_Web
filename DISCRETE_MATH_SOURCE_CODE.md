# Discrete Mathematics 2: Source Code Highlights

This guide maps the concepts in the report to the current RaphaCare backend.
The relevant implementation is inside [`backend/src/`](C:/Users/Lumi/Desktop/RVCare_Mobile_Web/backend/src).

## 4.2.1 CTR Greedy Scheduler

The scheduler is implemented in [`backend/src/scheduling/ctr.js`](C:/Users/Lumi/Desktop/RVCare_Mobile_Web/backend/src/scheduling/ctr.js).
There is no file named `appointment_scheduler.js` in the current repository.

The greedy selection happens in `recommend()`:

```js
for (const day of days) {
  const date = dayStr(day);
  const candidates = [];

  for (const hour of hours) {
    if (absMin(day, hour) < nowAbs) continue;

    for (const vetId of vets) {
      if (isTaken(schedule, vetId, date, hour)) continue;
      candidates.push({
        vetId,
        date,
        hour,
        workload: workloadOf(schedule, vetId, date),
      });
    }
  }

  if (candidates.length === 0) continue;

  const byHour = new Map();
  for (const candidate of candidates) {
    const current = byHour.get(candidate.hour);
    if (
      !current ||
      candidate.workload < current.workload ||
      (candidate.workload === current.workload &&
        candidate.vetId < current.vetId)
    ) {
      byHour.set(candidate.hour, candidate);
    }
  }

  ranked.push(...[...byHour.values()]
    .map((candidate) => {
      const difference = absMin(day, candidate.hour) - requestedAbs;
      return {
        ...candidate,
        dist: Math.abs(difference) / 60,
        before: difference < 0,
        sameDay: day === requestedDay,
        dayGap: Math.abs(day - requestedDay),
      };
    })
    .sort(
      (a, b) =>
        a.dist - b.dist ||
        a.hour - b.hour ||
        a.workload - b.workload ||
        a.vetId - b.vetId,
    ));
  break;
}
```

The greedy rule is: scan the nearest valid date, reject occupied or past
slots, choose the lowest-workload veterinarian for each hour, then rank by
distance from the requested time. The final result is limited to `K` (three)
recommendations.

The scheduler is called by [`backend/src/services/suggestionService.js`](C:/Users/Lumi/Desktop/RVCare_Mobile_Web/backend/src/services/suggestionService.js)
and tested in [`backend/test/ctr.test.js`](C:/Users/Lumi/Desktop/RVCare_Mobile_Web/backend/test/ctr.test.js).

## 4.2.2 FSM State Transition Controller

The current implementation is a bulk status controller, not a singular
`/api/appointments/:id/status` route.

Actual route:

```text
PATCH /api/admin/appointments/status
```

It is registered in [`backend/src/routes/adminRoute.js`](C:/Users/Lumi/Desktop/RVCare_Mobile_Web/backend/src/routes/adminRoute.js)
and implemented by `updateAppointmentStatuses()` in
[`backend/src/controllers/adminController.js`](C:/Users/Lumi/Desktop/RVCare_Mobile_Web/backend/src/controllers/adminController.js).

Core transition code:

```js
const ids = req.body.idsToUpdate ?? req.body.appointmentIds ?? [];
if (!Array.isArray(ids) || ids.length === 0 || !req.body.status) {
  return res.status(400).json({
    message: "Appointment IDs and status are required.",
  });
}

const appointmentIds = ids.map(Number).filter(Boolean);
const result = await prisma.$transaction(async (tx) => {
  const existing = await tx.appointment.findMany({
    where: {
      appointmentId: { in: appointmentIds },
      isDeleted: false,
    },
    select: {
      appointmentId: true,
      status: true,
      pet: {
        select: {
          petName: true,
          owner: { select: { accountId: true } },
        },
      },
      service: { select: { serviceName: true } },
    },
  });

  const updated = await tx.appointment.updateMany({
    where: {
      appointmentId: { in: appointmentIds },
      isDeleted: false,
    },
    data: { status: req.body.status },
  });

  return { updated, existing };
});
```

The appointment status values form the FSM's state set:

```prisma
enum AppointmentStatus {
  Pending
  Upcoming
  Rejected
  Completed
  Missed
  Cancelled
}
```

The enum is defined in [`backend/prisma/schema.prisma`](C:/Users/Lumi/Desktop/RVCare_Mobile_Web/backend/prisma/schema.prisma).
The controller also records an audit log and sends a customer notification
after a changed transition.

## 4.2.3 First-Order Logic SQL Query

The project does not currently use a raw SQL string for this operation. The
first-order logic is expressed through Prisma's `where` object in
[`backend/src/models/suggestionModel.js`](C:/Users/Lumi/Desktop/RVCare_Mobile_Web/backend/src/models/suggestionModel.js):

```js
const appointments = await prisma.appointment.findMany({
  where: {
    vetId: { in: vetIds },
    scheduledDate: {
      gte: new Date(`${fromDate}T00:00:00.000Z`),
      lte: new Date(`${toDate}T00:00:00.000Z`),
    },
    status: {
      notIn: ["Cancelled", "Rejected", "Completed", "Missed"],
    },
    isDeleted: false,
    pet: {
      is: {
        isDeleted: false,
        owner: {
          is: {
            isDeleted: false,
            account: { is: { isDeleted: false } },
          },
        },
        breed: { is: { isDeleted: false } },
      },
    },
    veterinarian: {
      is: {
        isDeleted: false,
        account: { is: { isDeleted: false } },
      },
    },
  },
  select: {
    vetId: true,
    scheduledDate: true,
    timeslot: { select: { startTime: true } },
  },
});
```

In logic notation, this means:

```text
Select appointment a where
  a.vetId belongs to the requested veterinarians
  AND fromDate <= a.scheduledDate <= toDate
  AND a.status is not Cancelled, Rejected, Completed, or Missed
  AND a.isDeleted = false
  AND the related pet, owner, account, breed, veterinarian, and vet account
      are all active.
```

An equivalent SQL-style query for explaining the predicate is:

```sql
SELECT a.vet_id, a.scheduled_date, t.start_time
FROM tbl_appointment AS a
JOIN tbl_timeslot AS t ON t.timeslot_id = a.timeslot_id
JOIN tbl_pet AS p ON p.pet_id = a.pet_id AND p.is_deleted = 0
JOIN tbl_pet_owner AS po ON po.owner_id = p.owner_id AND po.is_deleted = 0
JOIN tbl_account AS owner_account
  ON owner_account.account_id = po.account_id
 AND owner_account.is_deleted = 0
JOIN tbl_veterinarian AS v ON v.vet_id = a.vet_id AND v.is_deleted = 0
JOIN tbl_account AS vet_account
  ON vet_account.account_id = v.account_id
 AND vet_account.is_deleted = 0
WHERE a.vet_id IN (?, ?, ...)
  AND a.scheduled_date BETWEEN ? AND ?
  AND a.status NOT IN ('Cancelled', 'Rejected', 'Completed', 'Missed')
  AND a.is_deleted = 0;
```

## 4.2.4 Database Relational Mapping and Indexing

The main appointment relationships are mapped in
[`backend/prisma/schema.prisma`](C:/Users/Lumi/Desktop/RVCare_Mobile_Web/backend/prisma/schema.prisma):

```prisma
model Appointment {
  appointmentId Int               @id @default(autoincrement())
  vetId         Int               @map("vet_id")
  petId         Int               @map("pet_id")
  serviceId     Int               @map("service_id")
  scheduledDate DateTime          @map("scheduled_date") @db.Date
  timeslotId    Int               @map("timeslot_id")
  status        AppointmentStatus @default(Pending)

  timeslot     Timeslot     @relation(fields: [timeslotId], references: [timeslotId])
  veterinarian Veterinarian @relation(fields: [vetId], references: [vetId])
  pet          Pet          @relation(fields: [petId], references: [petId])
  service      Service      @relation(fields: [serviceId], references: [serviceId])

  @@index([vetId, scheduledDate, timeslotId],
    map: "tbl_appointment_index_booked")
  @@index([petId], map: "tbl_appointment_tbl_pet_FK")
  @@index([serviceId], map: "tbl_appointment_tbl_service_FK")
  @@map("tbl_appointment")
}
```

The composite index supports lookup of appointments by veterinarian, date,
and timeslot. The foreign-key indexes support joins from appointments to pets
and services. The migration that creates the booking lookup index is
[`backend/prisma/migrations/20261101120842_deleted_unique_index_in_appointments/migration.sql`](C:/Users/Lumi/Desktop/RVCare_Mobile_Web/backend/prisma/migrations/20261101120842_deleted_unique_index_in_appointments/migration.sql).

## Quick navigation

| Report section | File to open |
|---|---|
| Greedy scheduler | [`backend/src/scheduling/ctr.js`](C:/Users/Lumi/Desktop/RVCare_Mobile_Web/backend/src/scheduling/ctr.js) |
| Status transition route | [`backend/src/routes/adminRoute.js`](C:/Users/Lumi/Desktop/RVCare_Mobile_Web/backend/src/routes/adminRoute.js) |
| Status transition logic | [`backend/src/controllers/adminController.js`](C:/Users/Lumi/Desktop/RVCare_Mobile_Web/backend/src/controllers/adminController.js) |
| FOL-style query | [`backend/src/models/suggestionModel.js`](C:/Users/Lumi/Desktop/RVCare_Mobile_Web/backend/src/models/suggestionModel.js) |
| Relational mapping/indexes | [`backend/prisma/schema.prisma`](C:/Users/Lumi/Desktop/RVCare_Mobile_Web/backend/prisma/schema.prisma) |
