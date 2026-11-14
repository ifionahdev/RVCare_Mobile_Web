import { createHash } from "node:crypto";

const serializeSnapshot = (value) => {
  if (value == null) return null;
  return JSON.stringify(value, (key, entry) =>
    /password|token|secret/i.test(key) ? "[REDACTED]" : entry,
  );
};

export const createAuditLog = (
  tx,
  { accountId, action, targetTable, targetId, oldValue = null, newValue = null },
) => {
  const data = {
    accountId: accountId ?? null,
    action,
    targetTable,
    targetId,
    oldValue: serializeSnapshot(oldValue),
    newValue: serializeSnapshot(newValue),
  };
  const hash = createHash("sha256").update(JSON.stringify(data)).digest("hex");

  return tx.auditLog.create({ data: { ...data, hash } });
};
