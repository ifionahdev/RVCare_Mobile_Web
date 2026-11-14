import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";
import { prisma } from "../config/prisma.js";
import { createAuditLog } from "../services/auditLogService.js";

const uploadDirectory = fileURLToPath(new URL("../../uploads/records/", import.meta.url));
const maxAttachmentSize = 10 * 1024 * 1024;
const allowedMimeTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);
const fileExtensions = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
};

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    fs.mkdir(uploadDirectory, { recursive: true }).then(
      () => callback(null, uploadDirectory),
      callback,
    );
  },
  filename: (_req, file, callback) => {
    callback(null, `${crypto.randomUUID()}${fileExtensions[file.mimetype] ?? ""}`);
  },
});

const multerUpload = multer({
  storage,
  limits: { fileSize: maxAttachmentSize, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new Error("Attachments must be PDF, JPG, or PNG files."));
      return;
    }
    callback(null, true);
  },
});

export const uploadRecordAttachment = (req, res, next) => {
  multerUpload.single("attachment")(req, res, (error) => {
    if (!error) return next();
    const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    return res.status(status).json({ message: error.message });
  });
};

const httpError = (status, message) => Object.assign(new Error(message), { status });
const displayName = (account) =>
  [account?.firstName, account?.lastName].filter(Boolean).join(" ") || "Not listed";
const dateOnly = (value) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};
const timeOnly = (value) => {
  if (typeof value === "string" && /^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
};
const jsonText = (value) =>
  value == null ? "" : typeof value === "string" ? value : JSON.stringify(value);

const readId = (value, label) => {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw httpError(400, `${label} must be a positive integer.`);
  }
  return parsed;
};

const readText = (value, label, { required = false, maxLength = 10000 } = {}) => {
  const text = String(value ?? "").trim();
  if (required && !text) throw httpError(400, `${label} is required.`);
  if (text.length > maxLength) throw httpError(400, `${label} is too long.`);
  return text;
};

const readOptionalNumber = (value, label, max) => {
  if (value === "" || value == null) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > max) {
    throw httpError(400, `${label} must be a valid non-negative number.`);
  }
  return parsed;
};

const readPayload = (req) => {
  const body = req.body ?? {};
  let payload = body;
  if (typeof body.payload === "string") {
    try {
      payload = JSON.parse(body.payload);
    } catch {
      throw httpError(400, "Record data must be valid JSON.");
    }
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw httpError(400, "Record data must be an object.");
  }
  return payload;
};

const ownerNameFor = (pet) =>
  displayName(pet?.owner?.account);

const attachmentDto = (attachment) => ({
  id: attachment.attachmentId,
  originalName: attachment.originalName,
  mimeType: attachment.mimeType,
  fileSizeBytes: attachment.fileSizeBytes,
  uploadedAt: attachment.uploadedAt,
});

const visitSummary = (visit) => ({
  id: visit.visitId,
  appointmentId: visit.appointmentId,
  petId: visit.petId,
  petID: visit.petId,
  petName: visit.pet.petName,
  owner: ownerNameFor(visit.pet),
  ownerId: visit.pet.owner.accountId,
  serviceType: visit.service.serviceName,
  serviceId: visit.serviceId,
  date: dateOnly(visit.visitDate),
  time: timeOnly(visit.visitTime),
  veterinarian: displayName(visit.veterinarian.account),
  vetId: visit.vetId,
  status: visit.status,
  visitType: visit.visitType.replace("_", "-"),
  hasMedicalHistory: visit.medicalRecords.length > 0,
});

const medicalHistoryDto = (history, visit) => ({
  id: history.historyId,
  type: "medical",
  visitId: visit.visitId,
  petId: visit.petId,
  petID: visit.petId,
  petName: visit.pet.petName,
  owner: ownerNameFor(visit.pet),
  ownerId: visit.pet.owner.accountId,
  serviceType: visit.service.serviceName,
  date: dateOnly(visit.visitDate),
  time: timeOnly(visit.visitTime),
  veterinarian: displayName(visit.veterinarian.account),
  status: visit.status,
  visitType: visit.visitType.replace("_", "-"),
  weight: history.weightKg == null ? "" : String(history.weightKg),
  temperature: history.temperature == null ? "" : String(history.temperature),
  heartRate: history.heartRate == null ? "" : String(history.heartRate),
  complaint: jsonText(history.findings),
  assessment: jsonText(history.assessment),
  treatment: jsonText(history.treatmentPlan),
  followUp: jsonText(history.instructions),
  attachments: history.attachments.filter((item) => !item.isDeleted).map(attachmentDto),
});

const labResultDto = (labResult, visit) => {
  const values = labResult.labResultValues
    .filter((value) => !value.isDeleted && !value.parameter.isDeleted)
    .map((value) => ({
      parameterId: value.parameterId,
      parameter: value.parameter.name,
      result: value.textValue ?? (value.value == null ? "" : String(value.value)),
      unit: value.parameter.unit ?? "",
      referenceRange: value.parameter.refRangeText ?? "",
    }));
  const attachments = labResult.attachments
    .filter((item) => !item.isDeleted)
    .map(attachmentDto);

  return {
    id: labResult.labResultId,
    type: "lab",
    visitId: visit.visitId,
    petID: visit.petId,
    petName: visit.pet.petName,
    owner: ownerNameFor(visit.pet),
    veterinarian: displayName(visit.veterinarian.account),
    recordTitle: labResult.testType.name,
    testTypeId: labResult.testTypeId,
    uploadedOn: labResult.createdAt,
    createdAt: labResult.createdAt,
    recordStatus: labResult.status.toLowerCase(),
    isUploaded: labResult.status === "Final",
    interpretation: labResult.interpretation ?? "",
    results: values,
    attachments,
  };
};

const workspaceVisitInclude = {
  pet: {
    include: {
      owner: { include: { account: true } },
      breed: true,
    },
  },
  service: true,
  veterinarian: { include: { account: true } },
  medicalRecords: {
    include: {
      attachments: { where: { isDeleted: false } },
    },
  },
  labResults: {
    include: {
      testType: true,
      labResultValues: {
        include: { parameter: true },
        orderBy: { valueId: "asc" },
      },
      attachments: { where: { isDeleted: false } },
    },
  },
};

export const getRecordsWorkspace = async (_req, res, next) => {
  try {
    const [pets, visits, labTypes] = await Promise.all([
      prisma.pet.findMany({
        where: {
          isDeleted: false,
          owner: { is: { isDeleted: false } },
        },
        include: {
          breed: true,
          owner: { include: { account: true } },
        },
        orderBy: { petName: "asc" },
      }),
      prisma.visit.findMany({
        where: {
          isDeleted: false,
          pet: {
            is: {
              isDeleted: false,
              owner: { is: { isDeleted: false } },
            },
          },
        },
        include: workspaceVisitInclude,
        orderBy: [{ visitDate: "desc" }, { visitId: "desc" }],
      }),
      prisma.labTestType.findMany({
        where: { isActive: true, isDeleted: false },
        include: {
          parameters: {
            where: { isDeleted: false },
            orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
          },
        },
        orderBy: { name: "asc" },
      }),
    ]);

    return res.json({
      pets: pets.map((pet) => ({
        id: pet.petId,
        petID: pet.petId,
        petName: pet.petName,
        name: pet.petName,
        species: pet.breed.species,
        breed: pet.breed.breedName,
        gender: pet.gender,
        weight: pet.weightKg == null ? "" : `${pet.weightKg} kg`,
        owner: ownerNameFor(pet),
        ownerId: pet.owner.accountId,
      })),
      visits: visits.map(visitSummary),
      medicalHistories: visits.flatMap((visit) =>
        visit.medicalRecords.map((history) => medicalHistoryDto(history, visit)),
      ),
      labRecords: visits.flatMap((visit) =>
        visit.labResults.map((labResult) => labResultDto(labResult, visit)),
      ),
      labTypes: labTypes.map((type) => ({
        id: type.testTypeId,
        code: type.code,
        name: type.name,
        parameters: type.parameters.map((parameter) => ({
          id: parameter.parameterId,
          name: parameter.name,
          unit: parameter.unit ?? "",
          referenceRange: parameter.refRangeText ?? "",
        })),
      })),
    });
  } catch (error) {
    return next(error);
  }
};

const parseMedicalHistory = (payload) => ({
  visitId: readId(payload.visitId, "Visit"),
  weightKg: readOptionalNumber(payload.weight, "Weight", 999.99),
  temperature: readOptionalNumber(payload.temperature, "Temperature", 99.9),
  heartRate: (() => {
    if (payload.heartRate === "" || payload.heartRate == null) return null;
    const heartRate = Number(payload.heartRate);
    if (!Number.isSafeInteger(heartRate) || heartRate < 1 || heartRate > 300) {
      throw httpError(400, "Heart rate must be a whole number between 1 and 300.");
    }
    return heartRate;
  })(),
  findings: readText(payload.complaint, "Clinical findings", { required: true }),
  assessment: readText(payload.assessment, "Assessment", { required: true }),
  treatmentPlan: readText(payload.treatment, "Treatment plan", { required: true }),
  instructions: readText(payload.followUp, "Follow-up instructions"),
});

const attachmentData = async (file, accountId) => {
  if (!file) return null;
  const originalName = String(file.originalname).split(/[\\/]/).pop()
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .slice(0, 255);
  const checksum = crypto.createHash("sha256").update(await fs.readFile(file.path)).digest("hex");
  return {
    originalName: originalName || "record-attachment",
    storageKey: file.filename,
    mimeType: file.mimetype,
    fileSizeBytes: file.size,
    checksum,
    uploaderAccountId: accountId,
  };
};

const removeStoredFile = async (storageKey) => {
  if (!storageKey || path.basename(storageKey) !== storageKey) return;
  try {
    await fs.unlink(path.join(uploadDirectory, storageKey));
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Could not remove record attachment:", error);
    }
  }
};

const cleanupFailedUpload = async (req) => {
  if (req.file?.filename) await removeStoredFile(req.file.filename);
};

const findActiveVisit = async (tx, visitId) => {
  const visit = await tx.visit.findFirst({
    where: {
      visitId,
      isDeleted: false,
      pet: { is: { isDeleted: false, owner: { is: { isDeleted: false } } } },
    },
    include: workspaceVisitInclude,
  });
  if (!visit) throw httpError(404, "The selected visit could not be found.");
  return visit;
};

const findCompletedVisit = async (tx, visitId) => {
  const visit = await findActiveVisit(tx, visitId);
  if (visit.status !== "Completed") {
    throw httpError(400, "Lab results can only be linked to completed visits.");
  }
  return visit;
};

const historySnapshot = (history) => ({
  visitId: history.visitId,
  weightKg: history.weightKg == null ? null : String(history.weightKg),
  temperature: history.temperature == null ? null : String(history.temperature),
  heartRate: history.heartRate,
  findings: history.findings,
  assessment: history.assessment,
  treatmentPlan: history.treatmentPlan,
  instructions: history.instructions,
});

const runWithUploadCleanup = async (req, next, action) => {
  try {
    return await action();
  } catch (error) {
    await cleanupFailedUpload(req);
    return next(error);
  }
};

export const createMedicalHistory = async (req, res, next) =>
  runWithUploadCleanup(req, next, async () => {
    const input = parseMedicalHistory(readPayload(req));
    const fileData = await attachmentData(req.file, req.user.accountId);

    const created = await prisma.$transaction(async (tx) => {
      const visit = await findActiveVisit(tx, input.visitId);
      if (visit.medicalRecords.length) {
        throw httpError(409, "A medical history record already exists for this visit.");
      }

      const history = await tx.medicalHistory.create({ data: input });
      if (fileData) {
        await tx.attachment.create({
          data: { ...fileData, medicalHistoryId: history.historyId },
        });
      }
      await createAuditLog(tx, {
        accountId: req.user.accountId,
        action: "Created",
        targetTable: "tbl_medical_history",
        targetId: history.historyId,
        newValue: historySnapshot(history),
      });
      return history;
    });

    return res.status(201).json({ id: created.historyId });
  });

export const updateMedicalHistory = async (req, res, next) =>
  runWithUploadCleanup(req, next, async () => {
    const historyId = readId(req.params.historyId, "Medical history ID");
    const input = parseMedicalHistory(readPayload(req));
    const fileData = await attachmentData(req.file, req.user.accountId);
    const oldAttachments = fileData
      ? await prisma.attachment.findMany({
          where: { medicalHistoryId: historyId },
          select: { storageKey: true },
        })
      : [];

    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.medicalHistory.findUnique({
        where: { historyId },
        include: { visit: { include: { medicalRecords: true } } },
      });
      if (!current || current.visit.isDeleted) throw httpError(404, "Medical history record not found.");
      await findActiveVisit(tx, input.visitId);
      const duplicate = await tx.medicalHistory.findFirst({
        where: { visitId: input.visitId, historyId: { not: historyId } },
      });
      if (duplicate) throw httpError(409, "A medical history record already exists for this visit.");

      const history = await tx.medicalHistory.update({
        where: { historyId },
        data: input,
      });
      if (fileData) {
        await tx.attachment.deleteMany({ where: { medicalHistoryId: historyId } });
        await tx.attachment.create({
          data: { ...fileData, medicalHistoryId: historyId },
        });
      }
      await createAuditLog(tx, {
        accountId: req.user.accountId,
        action: "Updated",
        targetTable: "tbl_medical_history",
        targetId: historyId,
        oldValue: historySnapshot(current),
        newValue: historySnapshot(history),
      });
      return history;
    });

    await Promise.all(oldAttachments.map((attachment) => removeStoredFile(attachment.storageKey)));
    return res.json({ id: updated.historyId });
  });

export const deleteMedicalHistory = async (req, res, next) =>
  runWithUploadCleanup(req, next, async () => {
    const historyId = readId(req.params.historyId, "Medical history ID");
    const attachments = await prisma.attachment.findMany({
      where: { medicalHistoryId: historyId },
      select: { storageKey: true },
    });

    await prisma.$transaction(async (tx) => {
      const history = await tx.medicalHistory.findUnique({ where: { historyId } });
      if (!history) throw httpError(404, "Medical history record not found.");
      await tx.attachment.deleteMany({ where: { medicalHistoryId: historyId } });
      await tx.medicalHistory.delete({ where: { historyId } });
      await createAuditLog(tx, {
        accountId: req.user.accountId,
        action: "Deleted",
        targetTable: "tbl_medical_history",
        targetId: historyId,
        oldValue: historySnapshot(history),
      });
    });

    await Promise.all(attachments.map((attachment) => removeStoredFile(attachment.storageKey)));
    return res.status(204).end();
  });

const ensureTestType = async (tx, name) => {
  const existing = await tx.labTestType.findFirst({
    where: { name, isDeleted: false, isActive: true },
  });
  if (existing) return existing;

  const code = `CUSTOM_${crypto.createHash("sha256").update(name.toLowerCase()).digest("hex").slice(0, 13).toUpperCase()}`;
  return tx.labTestType.upsert({
    where: { code },
    update: { name, isActive: true, isDeleted: false },
    create: { code, name, isActive: true, isDeleted: false },
  });
};

const normalizeLabInput = (payload) => {
  if (payload?.results != null && !Array.isArray(payload.results)) {
    throw httpError(400, "Lab results must be an array.");
  }
  const results = payload?.results ?? [];
  const status = payload.status ?? (results.length ? "Final" : "Pending");
  if (!["Pending", "Final"].includes(status)) {
    throw httpError(400, "Result status must be Pending or Final.");
  }
  if (status === "Final" && results.length === 0) {
    throw httpError(400, "Final lab results must include at least one result value.");
  }
  return {
    visitId: readId(payload.visitId, "Visit"),
    testType: readText(payload.testType, "Test type", { required: true, maxLength: 100 }),
    status,
    interpretation: readText(payload.interpretation, "Interpretation", { maxLength: 255 }),
    results: results.map((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        throw httpError(400, `Result ${index + 1} must be an object.`);
      }
      const parameter = readText(item.parameter, `Result ${index + 1} parameter`, {
        required: true,
        maxLength: 100,
      });
      const result = readText(item.result, `Result ${index + 1} value`, {
        required: true,
        maxLength: 100,
      });
      const unit = readText(item.unit, `Result ${index + 1} unit`, { maxLength: 20 });
      const referenceRange = readText(item.referenceRange, `Result ${index + 1} reference range`, {
        maxLength: 100,
      });
      const numericValue = Number(result);
      if (Number.isFinite(numericValue) && Math.abs(numericValue) > 99999999.99) {
        throw httpError(400, `Result ${index + 1} exceeds the supported numeric range.`);
      }
      return {
        parameter,
        value: Number.isFinite(numericValue) ? numericValue : null,
        textValue: Number.isFinite(numericValue) ? null : result,
        unit: unit || null,
        referenceRange: referenceRange || null,
      };
    }),
  };
};

const saveLabValues = async (tx, labResultId, testTypeId, results) => {
  await tx.labResultValue.deleteMany({ where: { labResultId } });
  for (const result of results) {
    const existing = await tx.labTestParameter.findFirst({
      where: { testTypeId, name: result.parameter },
    });
    const parameterData = {
      testTypeId,
      name: result.parameter,
      unit: result.unit,
      refRangeText: result.referenceRange,
      displayOrder: existing?.displayOrder ?? null,
      isDeleted: false,
    };
    const parameter = existing
      ? await tx.labTestParameter.update({
          where: { parameterId: existing.parameterId },
          data: parameterData,
        })
      : await tx.labTestParameter.create({ data: parameterData });

    await tx.labResultValue.create({
      data: {
        labResultId,
        parameterId: parameter.parameterId,
        value: result.value,
        textValue: result.textValue,
      },
    });
  }
};

const labSnapshot = (labResult) => ({
  visitId: labResult.visitId,
  testTypeId: labResult.testTypeId,
  status: labResult.status,
  interpretation: labResult.interpretation,
});

export const createLabResult = async (req, res, next) =>
  runWithUploadCleanup(req, next, async () => {
    const input = normalizeLabInput(readPayload(req));
    const fileData = await attachmentData(req.file, req.user.accountId);

    const labResult = await prisma.$transaction(async (tx) => {
      await findCompletedVisit(tx, input.visitId);
      const testType = await ensureTestType(tx, input.testType);
      const created = await tx.labResult.create({
        data: {
          visitId: input.visitId,
          testTypeId: testType.testTypeId,
          status: input.status,
          interpretation: input.interpretation || null,
        },
      });
      await saveLabValues(tx, created.labResultId, testType.testTypeId, input.results);
      if (fileData) {
        await tx.attachment.create({
          data: { ...fileData, labResultId: created.labResultId },
        });
      }
      await createAuditLog(tx, {
        accountId: req.user.accountId,
        action: "Created",
        targetTable: "tbl_lab_result",
        targetId: created.labResultId,
        newValue: labSnapshot(created),
      });
      return created;
    });

    return res.status(201).json({ id: labResult.labResultId });
  });

export const updateLabResult = async (req, res, next) =>
  runWithUploadCleanup(req, next, async () => {
    const labResultId = readId(req.params.labResultId, "Lab result ID");
    const input = normalizeLabInput(readPayload(req));
    const fileData = await attachmentData(req.file, req.user.accountId);

    const oldAttachments = fileData
      ? await prisma.attachment.findMany({
          where: { labResultId },
          select: { storageKey: true },
        })
      : [];
    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.labResult.findUnique({ where: { labResultId } });
      if (!current) throw httpError(404, "Lab result not found.");
      await findCompletedVisit(tx, input.visitId);
      const testType = await ensureTestType(tx, input.testType);
      const labResult = await tx.labResult.update({
        where: { labResultId },
        data: {
          visitId: input.visitId,
          testTypeId: testType.testTypeId,
          status: input.status,
          interpretation: input.interpretation || null,
        },
      });
      await saveLabValues(tx, labResultId, testType.testTypeId, input.results);
      if (fileData) {
        await tx.attachment.deleteMany({ where: { labResultId } });
        await tx.attachment.create({ data: { ...fileData, labResultId } });
      }
      await createAuditLog(tx, {
        accountId: req.user.accountId,
        action: "Updated",
        targetTable: "tbl_lab_result",
        targetId: labResultId,
        oldValue: labSnapshot(current),
        newValue: labSnapshot(labResult),
      });
      return labResult;
    });

    await Promise.all(oldAttachments.map((attachment) => removeStoredFile(attachment.storageKey)));
    return res.json({ id: updated.labResultId });
  });

export const deleteLabResult = async (req, res, next) =>
  runWithUploadCleanup(req, next, async () => {
    const labResultId = readId(req.params.labResultId, "Lab result ID");
    const attachments = await prisma.attachment.findMany({
      where: { labResultId },
      select: { storageKey: true },
    });

    await prisma.$transaction(async (tx) => {
      const labResult = await tx.labResult.findUnique({ where: { labResultId } });
      if (!labResult) throw httpError(404, "Lab result not found.");
      await tx.attachment.deleteMany({ where: { labResultId } });
      await tx.labResultValue.deleteMany({ where: { labResultId } });
      await tx.labResult.delete({ where: { labResultId } });
      await createAuditLog(tx, {
        accountId: req.user.accountId,
        action: "Deleted",
        targetTable: "tbl_lab_result",
        targetId: labResultId,
        oldValue: labSnapshot(labResult),
      });
    });

    await Promise.all(attachments.map((attachment) => removeStoredFile(attachment.storageKey)));
    return res.status(204).end();
  });

export const downloadRecordAttachment = async (req, res, next) => {
  try {
    const attachmentId = readId(req.params.attachmentId, "Attachment ID");
    const attachment = await prisma.attachment.findFirst({
      where: { attachmentId, isDeleted: false },
      include: {
        medicalHistory: { include: { visit: true } },
        labResult: { include: { visit: true } },
      },
    });
    if (
      !attachment
      || (attachment.medicalHistory && attachment.medicalHistory.visit.isDeleted)
      || (attachment.labResult && attachment.labResult.visit.isDeleted)
    ) {
      throw httpError(404, "Record attachment not found.");
    }

    if (path.basename(attachment.storageKey) !== attachment.storageKey) {
      throw httpError(404, "Record attachment not found.");
    }

    return res.download(
      path.join(uploadDirectory, attachment.storageKey),
      attachment.originalName,
      (error) => {
        if (error && !res.headersSent) next(error);
      },
    );
  } catch (error) {
    return next(error);
  }
};
