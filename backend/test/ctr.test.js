import assert from "node:assert/strict";
import test from "node:test";
import {
  preferredIsFree,
  recommend,
  slotKey,
  validateRequest,
  windowDates,
} from "../src/scheduling/ctr.js";

const now = { date: "2026-11-07", minutes: 8 * 60 + 30 };

const schedule = (occupied = [], blocked = []) => ({
  vets: [1, 2, 3],
  occupied: new Set(occupied),
  blocked: new Set(blocked),
});

test("rejects invalid calendar dates and dates outside the booking window", () => {
  assert.equal(
    validateRequest(
      { date: "2026-02-31", hour: 8, vet: "Any" },
      [1, 2, 3],
      now,
    ),
    "INVALID_DATE",
  );
  assert.equal(
    validateRequest(
      { date: "2027-02-06", hour: 8, vet: "Any" },
      [1, 2, 3],
      now,
    ),
    "OUTSIDE_BOOKING_WINDOW",
  );
});

test("clips the recommendation window to the booking window", () => {
  assert.deepEqual(
    windowDates({ date: "2026-11-08", hour: 9, vet: "Any" }, now),
    { lo: "2026-11-07", hi: "2026-11-15" },
  );
});

test("does not treat a past same-day slot as preferred availability", () => {
  assert.equal(
    preferredIsFree(
      { date: "2026-11-07", hour: 8, vet: "Any" },
      schedule(),
      now,
    ),
    false,
  );
});

test("selects the lowest-workload veterinarian per hour for Any", () => {
  const occupied = [
    slotKey(1, "2026-11-07", 8),
    slotKey(1, "2026-11-07", 9),
    slotKey(2, "2026-11-07", 8),
  ];
  const recommendations = recommend(
    { date: "2026-11-07", hour: 10, vet: "Any" },
    schedule(occupied),
    { date: "2026-11-07", minutes: 7 * 60 },
  );

  assert.equal(recommendations.length, 3);
  assert.equal(recommendations[0].veterinarian_id, 3);
  assert.equal(recommendations[0].start_time, "10:00");
});

test("stops at the nearest date with availability", () => {
  const occupied = [];
  for (const vetId of [1, 2, 3]) {
    for (let hour = 8; hour < 20; hour++) {
      if (hour !== 10) occupied.push(slotKey(vetId, "2026-11-07", hour));
    }
  }

  const recommendations = recommend(
    { date: "2026-11-07", hour: 9, vet: "Any" },
    schedule(occupied),
    { date: "2026-11-07", minutes: 7 * 60 },
  );

  assert.equal(recommendations.length, 1);
  assert.equal(recommendations[0].date, "2026-11-07");
  assert.equal(recommendations[0].start_time, "10:00");
});
