import assert from "node:assert/strict";
import test from "node:test";
import { readCustomerProfileUpdate } from "../src/services/customerSettingsPolicy.js";

test("trims valid profile names and accepts an empty birthday", () => {
  const result = readCustomerProfileUpdate({
    firstName: "  Alex ",
    lastName: " Morgan  ",
    dateOfBirth: "",
  });

  assert.deepEqual(result, {
    firstName: "Alex",
    lastName: "Morgan",
    dateOfBirth: null,
  });
});

test("rejects malformed, impossible, and future birthdays", () => {
  for (const dateOfBirth of [
    "2001/01/01",
    "2001-02-29",
    "1899-12-31",
    "2999-01-01",
  ]) {
    assert.ok(
      readCustomerProfileUpdate({
        firstName: "Alex",
        lastName: "Morgan",
        dateOfBirth,
      }).error,
    );
  }
});

test("rejects missing and overlong names", () => {
  assert.ok(
    readCustomerProfileUpdate({
      firstName: " ",
      lastName: "Morgan",
      dateOfBirth: null,
    }).error,
  );
  assert.ok(
    readCustomerProfileUpdate({
      firstName: "a".repeat(101),
      lastName: "Morgan",
      dateOfBirth: null,
    }).error,
  );
});
