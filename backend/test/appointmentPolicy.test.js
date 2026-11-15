import assert from "node:assert/strict";
import test from "node:test";
import {
  isCancellationAllowed,
  isRescheduleAllowed,
} from "../src/services/appointmentPolicy.js";

const appointmentAt = (status, scheduledDate, startTime = "12:00") => ({
  status,
  scheduledDate: new Date(`${scheduledDate}T00:00:00.000Z`),
  timeslot: { startTime },
});

test("rescheduling is allowed at 24 hours and unavailable inside the cutoff", () => {
  const appointment = appointmentAt("Upcoming", "2026-11-18", "08:00");
  const atCutoff = new Date("2026-11-17T00:00:00.000Z");
  const insideCutoff = new Date("2026-11-17T00:01:00.000Z");

  assert.equal(isRescheduleAllowed(appointment, atCutoff), true);
  assert.equal(isRescheduleAllowed(appointment, insideCutoff), false);
});

test("approved appointments cannot be cancelled inside 72 hours", () => {
  const appointment = appointmentAt("Upcoming", "2026-11-18", "08:00");
  const atCutoff = new Date("2026-11-15T00:00:00.000Z");
  const insideCutoff = new Date("2026-11-15T00:01:00.000Z");

  assert.equal(isCancellationAllowed(appointment, atCutoff), true);
  assert.equal(isCancellationAllowed(appointment, insideCutoff), false);
  assert.equal(
    isCancellationAllowed(
      appointmentAt("Pending", "2026-11-15", "09:00"),
      new Date("2026-11-15T00:00:00.000Z"),
    ),
    true,
  );
});
