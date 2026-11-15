import { prisma } from "../config/prisma.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const parseDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    ? date
    : null;
};

const getDateRange = (query) => {
  const { startDate, endDate } = query;
  if (!startDate && !endDate) return { range: null };
  if (!startDate || !endDate) {
    return { error: "Both startDate and endDate are required." };
  }

  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (!start || !end) {
    return { error: "Dates must use the YYYY-MM-DD format." };
  }
  if (start > end) {
    return { error: "startDate must be on or before endDate." };
  }

  return { range: { start, end, endExclusive: new Date(end.getTime() + DAY_MS) } };
};

const dateOnlyFilter = (range) =>
  range ? { gte: range.start, lt: range.endExclusive } : undefined;

const dateTimeFilter = (range) =>
  range ? { gte: range.start, lt: range.endExclusive } : undefined;

const monthBuckets = (range) => {
  const now = new Date();
  const end = range?.end ?? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  const start = range?.start ?? new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 5, 1));
  const selectedFirstMonth = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const lastMonth = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  const latestFirstMonth = new Date(
    Date.UTC(lastMonth.getUTCFullYear(), lastMonth.getUTCMonth() - 11, 1),
  );
  const firstMonth =
    range && selectedFirstMonth < latestFirstMonth ? latestFirstMonth : selectedFirstMonth;
  const months = [];

  for (
    let month = firstMonth;
    month <= lastMonth && months.length < 12;
    month = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1))
  ) {
    const nextMonth = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1));
    const bucketStart = range && month < start ? start : month;
    const bucketEnd = range && nextMonth > range.endExclusive ? range.endExclusive : nextMonth;
    months.push({
      month,
      where: { gte: bucketStart, lt: bucketEnd },
      label: `${month.toLocaleString("en-US", { month: "short", timeZone: "UTC" })} ${month.getUTCFullYear()}`,
    });
  }

  return months;
};

const countByWeekday = (groups) => {
  const counts = Array(7).fill(0);
  for (const group of groups) {
    counts[new Date(group.scheduledDate ?? group.visitDate).getUTCDay()] += group._count._all;
  }
  return [
    ...WEEKDAYS.slice(1).map((day, index) => ({ day, count: counts[index + 1] })),
    { day: WEEKDAYS[0], count: counts[0] },
  ];
};

const csvCell = (value) => {
  const rawText = String(value ?? "");
  const text = /^[=+\-@]/.test(rawText) ? `'${rawText}` : rawText;
  return `"${text.replaceAll('"', '""')}"`;
};

const createCsv = (data) => {
  const rows = [["Report", "Category", "Metric", "Value"]];
  const add = (report, category, metric, value) =>
    rows.push([report, category, metric, value]);

  add("Appointments", "Summary", "Total", data.appointments.kpi.total);
  add("Appointments", "Summary", "Completion rate (%)", data.appointments.kpi.completionRate);
  add("Appointments", "Summary", "Cancelled", data.appointments.kpi.cancelled);
  for (const item of data.appointments.statusBreakdown) {
    add("Appointments", "Status", item.statusName, item.count);
  }
  for (const item of data.appointments.peakHours) {
    add("Appointments", "Peak hour", item.hour, item.count);
  }
  for (const item of data.appointments.weeklyTrend) {
    add("Appointments", "Weekday", item.day, item.count);
  }
  add("Users", "Summary", "Total pet owners", data.users.kpi.total);
  add("Users", "Summary", "New in selected period", data.users.kpi.new);
  add("Users", "Summary", "Active in last 30 days", data.users.kpi.active);
  for (const item of data.users.byRole) {
    add("Users", "Role", item.roleName, item.count);
  }
  for (const item of data.users.registrationTrend) {
    add("Users", "Registration trend", item.month, item.count);
  }
  add("Pets", "Summary", "Total pets", data.pets.kpi.total);
  add("Pets", "Summary", "New in selected period", data.pets.kpi.new);
  for (const item of data.pets.bySpecies) {
    add("Pets", "Species", item.species, item.count);
  }
  for (const item of data.pets.registrationTrend) {
    add("Pets", "Registration trend", item.month, item.count);
  }
  add("Visits", "Summary", "Total visits", data.visits.kpi.total);
  for (const item of data.visits.dailyTrend) {
    add("Visits", "Weekday", item.day, item.count);
  }
  for (const item of data.visits.topServices) {
    add("Visits", "Service", item.service, item.count);
  }

  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
};

const buildReports = async (range) => {
  const appointmentWhere = {
    isDeleted: false,
    ...(range ? { scheduledDate: dateOnlyFilter(range) } : {}),
    pet: {
      is: {
        isDeleted: false,
        owner: {
          is: {
            isDeleted: false,
            account: { is: { isDeleted: false } },
          },
        },
        breed: { is: { isDeleted: false } },
      },
    },
    veterinarian: {
      is: {
        isDeleted: false,
        account: { is: { isDeleted: false } },
      },
    },
  };
  const visitWhere = {
    isDeleted: false,
    ...(range ? { visitDate: dateOnlyFilter(range) } : {}),
    pet: {
      is: {
        isDeleted: false,
        owner: {
          is: {
            isDeleted: false,
            account: { is: { isDeleted: false } },
          },
        },
        breed: { is: { isDeleted: false } },
      },
    },
    veterinarian: {
      is: {
        isDeleted: false,
        account: { is: { isDeleted: false } },
      },
    },
  };
  const activePetsWhere = {
    isDeleted: false,
    owner: {
      is: {
        isDeleted: false,
        account: { is: { isDeleted: false } },
      },
    },
    breed: { is: { isDeleted: false } },
  };
  const activeOwnersWhere = {
    isDeleted: false,
    account: { is: { isDeleted: false } },
  };
  const buckets = monthBuckets(range);
  const today = new Date();
  const todayStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const todayInRange =
    !range || (todayStart >= range.start && todayStart < range.endExclusive);
  const activityStart = new Date(Date.now() - 30 * DAY_MS);

  const [
    appointmentTotal,
    appointmentStatuses,
    appointmentDays,
    appointmentHours,
    todayAppointments,
    allOwners,
    newOwners,
    roleCounts,
    roles,
    activeAccounts,
    ownerMonthlyCounts,
    allPets,
    petSpeciesGroups,
    newPets,
    petMonthlyCounts,
    visitTotal,
    visitDays,
    visitServiceGroups,
    todayVisits,
    services,
  ] = await Promise.all([
    prisma.appointment.count({ where: appointmentWhere }),
    prisma.appointment.groupBy({
      by: ["status"],
      where: appointmentWhere,
      _count: { _all: true },
    }),
    prisma.appointment.groupBy({
      by: ["scheduledDate"],
      where: appointmentWhere,
      _count: { _all: true },
    }),
    prisma.appointment.groupBy({
      by: ["timeslotId"],
      where: appointmentWhere,
      _count: { _all: true },
    }),
    todayInRange
      ? prisma.appointment.count({
          where: { ...appointmentWhere, scheduledDate: todayStart },
        })
      : 0,
    prisma.petOwner.count({ where: activeOwnersWhere }),
    prisma.petOwner.count({
      where: {
        ...activeOwnersWhere,
        account: {
          is: { isDeleted: false, ...(range ? { dateRegistered: dateTimeFilter(range) } : {}) },
        },
      },
    }),
    prisma.account.groupBy({
      by: ["roleId"],
      where: { isDeleted: false },
      _count: { _all: true },
    }),
    prisma.role.findMany({ select: { roleId: true, roleName: true, roleSlug: true } }),
    prisma.activityLog.groupBy({
      by: ["accountId"],
      where: {
        createdAt: { gte: activityStart },
        account: {
          is: {
            isDeleted: false,
            role: { is: { roleSlug: "customer" } },
            petOwner: { is: { isDeleted: false } },
          },
        },
      },
    }),
    Promise.all(
      buckets.map(({ where }) =>
        prisma.petOwner.count({
          where: {
            ...activeOwnersWhere,
            account: { is: { isDeleted: false, dateRegistered: where } },
          },
        }),
      ),
    ),
    prisma.pet.count({ where: activePetsWhere }),
    prisma.pet.groupBy({
      by: ["breedId"],
      where: activePetsWhere,
      _count: { _all: true },
    }),
    prisma.pet.count({
      where: {
        ...activePetsWhere,
        ...(range ? { dateRegistered: dateTimeFilter(range) } : {}),
      },
    }),
    Promise.all(
      buckets.map(({ where }) =>
        prisma.pet.count({
          where: { ...activePetsWhere, dateRegistered: where },
        }),
      ),
    ),
    prisma.visit.count({ where: visitWhere }),
    prisma.visit.groupBy({
      by: ["visitDate"],
      where: visitWhere,
      _count: { _all: true },
    }),
    prisma.visit.groupBy({
      by: ["serviceId"],
      where: visitWhere,
      _count: { _all: true },
    }),
    todayInRange
      ? prisma.visit.count({ where: { ...visitWhere, visitDate: todayStart } })
      : 0,
    prisma.service.findMany({ select: { serviceId: true, serviceName: true } }),
  ]);

  const timeslotIds = appointmentHours.map(({ timeslotId }) => timeslotId);
  const breedIds = petSpeciesGroups.map(({ breedId }) => breedId);
  const [timeslots, breeds] = await Promise.all([
    timeslotIds.length
      ? prisma.timeslot.findMany({
          where: { timeslotId: { in: timeslotIds } },
          select: { timeslotId: true, startTime: true },
        })
      : [],
    breedIds.length
      ? prisma.petBreed.findMany({
          where: { breedId: { in: breedIds } },
          select: { breedId: true, species: true },
        })
      : [],
  ]);

  const statusBreakdown = appointmentStatuses.map(({ status, _count }) => ({
    statusName: status,
    count: _count._all,
  }));
  const completedAppointments =
    statusBreakdown.find(({ statusName }) => statusName === "Completed")?.count ?? 0;
  const cancelledAppointments =
    statusBreakdown.find(({ statusName }) => statusName === "Cancelled")?.count ?? 0;
  const timeslotById = new Map(timeslots.map((item) => [item.timeslotId, item.startTime]));
  const serviceById = new Map(services.map((item) => [item.serviceId, item.serviceName]));
  const breedById = new Map(breeds.map((item) => [item.breedId, item.species]));
  const speciesCounts = new Map();
  for (const { breedId, _count } of petSpeciesGroups) {
    const species = breedById.get(breedId);
    if (species) speciesCounts.set(species, (speciesCounts.get(species) ?? 0) + _count._all);
  }
  const roleById = new Map(roles.map((item) => [item.roleId, item]));
  const visitDayCounts = visitDays.map(({ visitDate, _count }) => ({
    visitDate,
    _count,
  }));
  const averageVisitsPerDay = range
    ? Math.round((visitTotal / (Math.floor((range.endExclusive - range.start) / DAY_MS) || 1)) * 10) / 10
    : Math.round((visitTotal / Math.max(visitDays.length, 1)) * 10) / 10;

  return {
    appointments: {
      kpi: {
        total: appointmentTotal,
        completionRate: appointmentTotal
          ? Math.round((completedAppointments / appointmentTotal) * 100)
          : 0,
        cancelled: cancelledAppointments,
        today: todayAppointments,
      },
      weeklyTrend: countByWeekday(
        appointmentDays.map(({ scheduledDate, _count }) => ({
          scheduledDate,
          _count,
        })),
      ),
      statusBreakdown,
      peakHours: appointmentHours
        .map(({ timeslotId, _count }) => ({
          hour: timeslotById.get(timeslotId) ?? "00:00",
          count: _count._all,
        }))
        .sort((a, b) => a.hour.localeCompare(b.hour)),
    },
    users: {
      kpi: {
        total: allOwners,
        new: newOwners,
        active: activeAccounts.length,
      },
      byRole: roleCounts
        .map(({ roleId, _count }) => {
          const role = roleById.get(roleId);
          return role
            ? {
                roleName: role.roleName,
                roleSlug: role.roleSlug,
                count: _count._all,
              }
            : null;
        })
        .filter(Boolean),
      registrationTrend: buckets.map((bucket, index) => ({
        month: bucket.label,
        count: ownerMonthlyCounts[index],
      })),
    },
    pets: {
      kpi: { total: allPets, new: newPets },
      bySpecies: [...speciesCounts].map(([species, count]) => ({ species, count })),
      registrationTrend: buckets.map((bucket, index) => ({
        month: bucket.label,
        count: petMonthlyCounts[index],
      })),
    },
    visits: {
      kpi: { total: visitTotal },
      dailyTrend: countByWeekday(visitDayCounts),
      topServices: visitServiceGroups
        .map(({ serviceId, _count }) => ({
          service: serviceById.get(serviceId) ?? "Unknown service",
          count: _count._all,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6),
      insights: {
        dailyAverage: averageVisitsPerDay,
        today: todayVisits,
        mostPopularDay: countByWeekday(visitDayCounts).reduce(
          (best, item) => (item.count > best.count ? item : best),
          { day: "N/A", count: 0 },
        ).day,
        mostPopularDayCount: Math.max(
          0,
          ...countByWeekday(visitDayCounts).map((item) => item.count),
        ),
      },
    },
  };
};

export const getReports = async (req, res) => {
  const parsed = getDateRange(req.query);
  if (parsed.error) {
    return res.status(400).json({ success: false, message: parsed.error });
  }

  const data = await buildReports(parsed.range);
  return res.json({ success: true, data });
};

export const exportReportsCsv = async (req, res) => {
  const parsed = getDateRange(req.query);
  if (parsed.error) {
    return res.status(400).json({ success: false, message: parsed.error });
  }

  const data = await buildReports(parsed.range);
  const csv = createCsv(data);
  const filename = `raphacare-reports-${new Date().toISOString().slice(0, 10)}.csv`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  return res.send(`\uFEFF${csv}`);
};
