import PDFDocument from "pdfkit";

const margin = 42;
const teal = "#087F89";
const heading = "#20313D";
const muted = "#657782";
const border = "#DCE7EA";

const humanize = (value) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const decodeStructuredValue = (value) => {
  if (typeof value !== "string") return value;
  const text = value.trim();
  if (!text || !["{", "["].includes(text[0])) return value;
  try {
    return JSON.parse(text);
  } catch {
    return value;
  }
};

const structuredLines = (value, depth = 0) => {
  const decoded = decodeStructuredValue(value);
  if (decoded == null || decoded === "") return [];
  if (Array.isArray(decoded)) {
    return decoded.flatMap((entry) => structuredLines(entry, depth));
  }
  if (typeof decoded === "object") {
    return Object.entries(decoded).flatMap(([key, entry]) => {
      if (entry == null || entry === "") return [];
      const label = humanize(key);
      if (typeof entry === "object") {
        return [
          `${"  ".repeat(depth)}${label}:`,
          ...structuredLines(entry, depth + 1),
        ];
      }
      return [`${"  ".repeat(depth)}${label}: ${String(entry)}`];
    });
  }
  return String(decoded)
    .split(/\r?\n/)
    .map((line) => `${"  ".repeat(depth)}${line.trim()}`)
    .filter((line) => line.trim());
};

const ensureRoom = (doc, height = 72) => {
  if (doc.y + height > doc.page.height - margin) doc.addPage();
};

const addSection = (doc, title) => {
  ensureRoom(doc, 42);
  doc.moveDown(0.75);
  doc.x = margin;
  doc.fillColor(teal).font("Helvetica-Bold").fontSize(12).text(title);
  const lineY = doc.y + 4;
  doc.moveTo(margin, lineY)
    .lineTo(doc.page.width - margin, lineY)
    .lineWidth(0.7)
    .strokeColor(border)
    .stroke();
  doc.moveDown(0.55);
};

const addField = (doc, label, value) => {
  const lines = structuredLines(value);
  if (!lines.length) return;
  ensureRoom(doc, 44);
  doc.x = margin;
  doc.fillColor(muted).font("Helvetica-Bold").fontSize(9).text(label);
  doc.moveDown(0.2);
  doc.fillColor(heading)
    .font("Helvetica")
    .fontSize(10)
    .text(lines.join("\n"), {
      x: margin,
      width: doc.page.width - margin * 2,
    });
  doc.moveDown(0.55);
};

const addHeader = (doc, title, recordId, recordDate) => {
  const width = doc.page.width;
  doc.rect(0, 0, width, 86).fill(teal);
  doc.fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(18)
    .text("RAPHACARE", margin, 22);
  doc.font("Helvetica").fontSize(9).text("VETERINARY CARE RECORD", margin, 50);
  doc.y = 106;
  doc.fillColor(heading).font("Helvetica-Bold").fontSize(21).text(title);
  doc.moveDown(0.35);
  doc.fillColor(muted)
    .font("Helvetica")
    .fontSize(9)
    .text(`Record #${recordId}  |  Visit date: ${recordDate || "Not listed"}`);
  doc.moveDown(0.7);
};

const addSummary = (doc, record) => {
  addSection(doc, "PATIENT AND VISIT");
  const fields = [
    ["Patient", record.petName],
    ["Species", record.species],
    ["Breed", record.breed],
    ["Owner", record.ownerName],
    ["Service", record.serviceName],
    ["Veterinarian", record.veterinarianName],
    ["Record date", record.recordDate],
    ["Visit date", record.visitDate],
    ["Visit time", record.visitTime],
  ];

  const contentWidth = doc.page.width - margin * 2;
  const gap = 18;
  const columnWidth = (contentWidth - gap) / 2;
  for (let index = 0; index < fields.length; index += 2) {
    const row = fields.slice(index, index + 2);
    const rowHeight = Math.max(
      38,
      ...row.map(
        ([, value]) =>
          13 +
          doc.heightOfString(value || "Not listed", {
            width: columnWidth,
            font: "Helvetica",
            fontSize: 10,
          }) +
          6,
      ),
    );
    ensureRoom(doc, rowHeight);
    const rowY = doc.y;
    for (let column = 0; column < 2; column += 1) {
      const field = fields[index + column];
      if (!field) continue;
      const x = margin + column * (columnWidth + gap);
      doc.fillColor(muted)
        .font("Helvetica-Bold")
        .fontSize(8)
        .text(field[0].toUpperCase(), x, rowY, { width: columnWidth });
      doc.fillColor(heading)
        .font("Helvetica")
        .fontSize(10)
        .text(field[1] || "Not listed", x, rowY + 13, { width: columnWidth });
    }
    doc.y = rowY + rowHeight;
  }
};

const addVitals = (doc, record) => {
  const fields = [
    ["Weight", record.weight ? `${record.weight} kg` : ""],
    ["Temperature", record.temperature ? `${record.temperature} °C` : ""],
    ["Heart rate", record.heartRate ? `${record.heartRate} bpm` : ""],
  ].filter(([, value]) => value);
  if (!fields.length) return;

  addSection(doc, "VITALS");
  doc.fillColor(heading).font("Helvetica").fontSize(10);
  doc.text(fields.map(([label, value]) => `${label}: ${value}`).join("     "));
};

const addLabResultsTable = (doc, results) => {
  const columns = [
    { title: "TEST", key: "parameter", width: 178 },
    { title: "RESULT", key: "result", width: 96 },
    { title: "UNIT", key: "unit", width: 64 },
    { title: "REFERENCE RANGE", key: "referenceRange", width: 173 },
  ];
  const tableWidth = columns.reduce((total, column) => total + column.width, 0);

  const drawHeader = () => {
    const y = doc.y;
    doc.rect(margin, y, tableWidth, 24).fill("#E8F3F4");
    let x = margin;
    for (const column of columns) {
      doc.fillColor(teal)
        .font("Helvetica-Bold")
        .fontSize(8)
        .text(column.title, x + 5, y + 8, { width: column.width - 10 });
      x += column.width;
    }
    doc.y = y + 24;
  };

  addSection(doc, "LABORATORY RESULTS");
  if (!results.length) {
    doc.fillColor(muted)
      .font("Helvetica")
      .fontSize(10)
      .text("No result values are recorded.");
    return;
  }

  drawHeader();
  results.forEach((result, index) => {
    const values = columns.map((column) => String(result[column.key] ?? ""));
    const heights = columns.map((column, columnIndex) =>
      doc.heightOfString(values[columnIndex] || "-", {
        width: column.width - 10,
        font: "Helvetica",
        fontSize: 9,
      }),
    );
    const rowHeight = Math.max(24, ...heights.map((height) => height + 12));
    if (doc.y + rowHeight > doc.page.height - margin) {
      doc.addPage();
      drawHeader();
    }

    const y = doc.y;
    if (index % 2 === 0) {
      doc.rect(margin, y, tableWidth, rowHeight).fill("#F7FAFA");
    }
    let x = margin;
    columns.forEach((column, columnIndex) => {
      doc.fillColor(heading)
        .font("Helvetica")
        .fontSize(9)
        .text(values[columnIndex] || "-", x + 5, y + 6, {
          width: column.width - 10,
        });
      x += column.width;
    });
    doc.y = y + rowHeight;
  });
  doc.x = margin;
  doc.moveDown(0.5);
};

const renderRecord = (doc, record) => {
  const title =
    record.type === "medical" ? "Medical Record" : "Laboratory Report";
  addHeader(doc, title, record.recordId, record.recordDate);
  addSummary(doc, record);

  if (record.type === "medical") {
    addVitals(doc, record);
    const clinicalFields = [
      ["FINDINGS / COMPLAINT", record.findings],
      ["ASSESSMENT", record.assessment],
      ["TREATMENT PLAN", record.treatmentPlan],
      ["FOLLOW-UP / INSTRUCTIONS", record.instructions],
    ].filter(([, value]) => structuredLines(value).length);
    addSection(doc, "CLINICAL NOTES");
    if (clinicalFields.length) {
      clinicalFields.forEach(([label, value]) => addField(doc, label, value));
    } else {
      doc.fillColor(muted)
        .font("Helvetica")
        .fontSize(10)
        .text("No clinical notes were entered for this record.");
    }
  } else {
    addLabResultsTable(doc, record.results);
    addField(doc, "INTERPRETATION", record.interpretation);
  }

  doc.moveDown(0.7);
  ensureRoom(doc, 24);
  doc.fillColor(muted)
    .font("Helvetica")
    .fontSize(8)
    .text(
      `Generated ${new Date().toISOString().slice(0, 10)} by Raphacare.`,
      { align: "center" },
    );
};

export const generateRecordPdf = (record) =>
  new Promise((resolve, reject) => {
    const document = new PDFDocument({
      size: "A4",
      margins: { top: margin, right: margin, bottom: margin, left: margin },
      info: {
        Title: `${record.petName} - ${record.type === "medical" ? "Medical Record" : "Laboratory Report"}`,
        Author: "Raphacare",
        Subject: `Veterinary record ${record.recordId}`,
      },
    });
    const chunks = [];
    document.on("data", (chunk) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);

    try {
      renderRecord(document, record);
      document.end();
    } catch (error) {
      reject(error);
    }
  });
