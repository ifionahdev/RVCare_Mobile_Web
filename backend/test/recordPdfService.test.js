import assert from "node:assert/strict";
import test from "node:test";
import { generateRecordPdf } from "../src/services/recordPdfService.js";

const recordDetails = {
  recordId: 18,
  recordDate: "2026-11-12",
  visitDate: "2026-11-10",
  visitTime: "09:30",
  petName: "Luna",
  species: "Dog",
  breed: "Golden Retriever",
  ownerName: "Alex Morgan",
  serviceName: "Wellness Exam",
  veterinarianName: "Dr. Rivera",
};

test("generates an organized medical record PDF", async () => {
  const pdf = await generateRecordPdf({
    ...recordDetails,
    type: "medical",
    weight: "24.5",
    temperature: "38.4",
    heartRate: "90",
    findings: { symptoms: ["itching", "redness"] },
    assessment: "Mild irritation",
    treatmentPlan: "Clean and monitor",
    instructions: "Follow up in two weeks",
  });

  assert.equal(pdf.toString("ascii", 0, 5), "%PDF-");
  assert.ok(pdf.length > 1000);
});

test("generates a laboratory PDF with a results table", async () => {
  const pdf = await generateRecordPdf({
    ...recordDetails,
    type: "laboratory",
    interpretation: "Within expected range.",
    results: [
      {
        parameter: "Hemoglobin",
        result: "14.2",
        unit: "g/dL",
        referenceRange: "12.0 - 18.0",
      },
    ],
  });

  assert.equal(pdf.toString("ascii", 0, 5), "%PDF-");
  assert.ok(pdf.length > 1000);
});
