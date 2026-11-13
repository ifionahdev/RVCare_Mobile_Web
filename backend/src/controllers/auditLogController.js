import { prisma } from "../config/prisma.js";

const roleNames = {
  admin: "Administrator",
  vet: "Veterinarian",
  customer: "Customer",
};

const tableNames = {
  tbl_account: "Accounts",
  tbl_admin: "Administrators",
  tbl_appointment: "Appointments",
  tbl_content_video: "Videos",
  tbl_medical_record: "Medical records",
  tbl_pet: "Pets",
  tbl_pet_care_category: "Pet care categories",
  tbl_pet_care_tip: "Pet care tips",
  tbl_pet_owner: "Pet owners",
  tbl_video_category: "Video categories",
  tbl_veterinarian: "Veterinarians",
  tbl_veterinarian_schedule: "Veterinarian schedules",
  tbl_veterinarian_time_off: "Veterinarian time off",
  tbl_visit: "Visits",
};

const tableLabel = (table) =>
  tableNames[table] ??
  table.replace(/^tbl_/, "").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const readPositiveInteger = (value, fallback) => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const readDate = (value, endOfDay = false) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
    ? null
    : date;
};

const parseSnapshot = (value) => {
  if (value == null) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const redactSnapshot = (value) => {
  if (Array.isArray(value)) return value.map(redactSnapshot);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        /password|token|secret/i.test(key) ? "[REDACTED]" : redactSnapshot(entry),
      ]),
    );
  }
  return value;
};

const actorName = (account) =>
  account
    ? [account.firstName, account.lastName].filter(Boolean).join(" ") || account.email
    : "Deleted account";

const auditLogDto = (entry) => ({
  id: entry.auditId,
  action: entry.action,
  createdAt: entry.createdAt,
  accountId: entry.accountId,
  actorName: actorName(entry.account),
  actorRole: entry.account
    ? roleNames[entry.account.role.roleSlug] ?? entry.account.role.roleSlug
    : "Unknown",
  targetTable: entry.targetTable,
  module: tableLabel(entry.targetTable),
  targetId: entry.targetId,
  oldValue: redactSnapshot(parseSnapshot(entry.oldValue)),
  newValue: redactSnapshot(parseSnapshot(entry.newValue)),
});

const readFilters = (query) => {
  const page = readPositiveInteger(query.page, 1);
  const pageSize = Math.min(readPositiveInteger(query.pageSize, 6), 100);
  const search = typeof query.search === "string" ? query.search.trim().slice(0, 100) : "";
  const where = {};

  if (query.accountId === "unknown") {
    where.accountId = null;
  } else if (query.accountId && query.accountId !== "all") {
    const accountId = readPositiveInteger(query.accountId, null);
    if (!accountId) return { error: "Invalid audit-log user filter." };
    where.accountId = accountId;
  }

  if (query.targetTable && query.targetTable !== "all") {
    if (typeof query.targetTable !== "string" || query.targetTable.length > 100) {
      return { error: "Invalid audit-log module filter." };
    }
    where.targetTable = query.targetTable;
  }

  if (query.startDate || query.endDate) {
    const startDate = query.startDate ? readDate(query.startDate) : null;
    const endDate = query.endDate ? readDate(query.endDate, true) : null;
    if ((query.startDate && !startDate) || (query.endDate && !endDate)) {
      return { error: "Audit-log date filters must use valid YYYY-MM-DD dates." };
    }
    if (startDate && endDate && startDate > endDate) {
      return { error: "Start date must be on or before end date." };
    }
    where.createdAt = {
      ...(startDate ? { gte: startDate } : {}),
      ...(endDate ? { lte: endDate } : {}),
    };
  }

  if (search) {
    const parsedSearch = /^\d+$/.test(search) ? Number(search) : null;
    const numericSearch = Number.isSafeInteger(parsedSearch) ? parsedSearch : null;
    where.AND = [
      {
        OR: [
          { targetTable: { contains: search } },
          ...(numericSearch
            ? [{ auditId: numericSearch }, { targetId: numericSearch }]
            : []),
          {
            account: {
              is: {
                OR: [
                  { firstName: { contains: search } },
                  { lastName: { contains: search } },
                  { email: { contains: search } },
                ],
              },
            },
          },
        ],
      },
    ];
  }

  return { page, pageSize, where };
};

const accountInclude = {
  role: { select: { roleSlug: true } },
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const filters = readFilters(req.query);
    if (filters.error) {
      return res.status(400).json({ success: false, message: filters.error });
    }

    const [total, entries] = await Promise.all([
      prisma.auditLog.count({ where: filters.where }),
      prisma.auditLog.findMany({
        where: filters.where,
        include: { account: { select: { firstName: true, lastName: true, email: true, role: accountInclude.role } } },
        orderBy: [{ createdAt: "desc" }, { auditId: "desc" }],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
    ]);

    return res.json({
      success: true,
      data: {
        entries: entries.map(auditLogDto),
        pagination: {
          page: filters.page,
          pageSize: filters.pageSize,
          total,
          pageCount: Math.max(1, Math.ceil(total / filters.pageSize)),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getAuditLogFilters = async (_req, res, next) => {
  try {
    const [actors, targetTables, hasUnknownActor] = await Promise.all([
      prisma.auditLog.findMany({
        where: { accountId: { not: null } },
        distinct: ["accountId"],
        select: {
          accountId: true,
          account: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              role: accountInclude.role,
            },
          },
        },
        orderBy: { accountId: "asc" },
      }),
      prisma.auditLog.findMany({
        distinct: ["targetTable"],
        select: { targetTable: true },
        orderBy: { targetTable: "asc" },
      }),
      prisma.auditLog.findFirst({
        where: { accountId: null },
        select: { auditId: true },
      }),
    ]);

    return res.json({
      success: true,
      data: {
        users: actors
          .filter((entry) => entry.account)
          .map((entry) => ({
            id: entry.accountId,
            label: `${actorName(entry.account)} (${roleNames[entry.account.role.roleSlug] ?? entry.account.role.roleSlug})`,
          })),
        hasUnknownActor: Boolean(hasUnknownActor),
        modules: targetTables.map(({ targetTable }) => ({
          value: targetTable,
          label: tableLabel(targetTable),
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
};
