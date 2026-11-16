import { createHash } from "node:crypto";

const GENESIS_HASH = "0".repeat(64);

const serializeSnapshot = (value) => {
  if (value == null) return null;
  return JSON.stringify(value, (key, entry) =>
    /password|token|secret/i.test(key) ? "[REDACTED]" : entry,
  );
};

export const createAuditLog = async (
  tx,
  { accountId, action, targetTable, targetId, oldValue = null, newValue = null },
) => {
  const previousEntry = await tx.auditLog.findFirst({
    orderBy: { auditId: "desc" },
    select: { hash: true },
  });
  const previousHash = previousEntry?.hash ?? GENESIS_HASH;
  const createdAt = new Date();
  createdAt.setMilliseconds(0);
  const data = {
    accountId: accountId ?? null,
    action,
    targetTable,
    targetId,
    oldValue: serializeSnapshot(oldValue),
    newValue: serializeSnapshot(newValue),
    previousHash,
  };
  const hash = createHash("sha256")
    .update(JSON.stringify({ ...data, createdAt: createdAt.toISOString() }))
    .digest("hex");

  return tx.auditLog.create({ data: { ...data, createdAt, hash } });
};
