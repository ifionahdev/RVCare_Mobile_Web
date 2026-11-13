const serializeSnapshot = (value) => {
  if (value == null) return null;
  return JSON.stringify(value, (key, entry) =>
    /password|token|secret/i.test(key) ? "[REDACTED]" : entry,
  );
};

export const createAuditLog = (
  tx,
  { accountId, action, targetTable, targetId, oldValue = null, newValue = null },
) =>
  tx.auditLog.create({
    data: {
      accountId: accountId ?? null,
      action,
      targetTable,
      targetId,
      oldValue: serializeSnapshot(oldValue),
      newValue: serializeSnapshot(newValue),
    },
  });
