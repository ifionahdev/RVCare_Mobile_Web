import { useEffect, useState } from "react";
import Header from "../components/template/Header.jsx";
import AuditLogFilters from "../components/audit-log/AuditLogFilters.jsx";
import AuditLogTable from "../components/audit-log/AuditLogTable.jsx";
import ChangeDetailsPanel from "../components/audit-log/ChangeDetailsPanel.jsx";
import api from "../api/axios.js";

const pageSize = 6;

const toLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDateParams = (range) => {
  if (range === "all") return {};
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - (range === "last7" ? 6 : 29));
  return {
    startDate: toLocalDateString(start),
    endDate: toLocalDateString(end),
  };
};

const escapeCsv = (value) => {
  const text = String(value ?? "");
  const safeText = /^[\t\r\n ]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replace(/"/g, '""')}"`;
};
const snapshotForCsv = (value) =>
  value == null ? "" : typeof value === "string" ? value : JSON.stringify(value);

export default function AuditLog() {
  const [search, setSearch] = useState("");
  const [user, setUser] = useState("all");
  const [module, setModule] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [entries, setEntries] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize,
    total: 0,
    pageCount: 1,
  });
  const [users, setUsers] = useState([]);
  const [modules, setModules] = useState([]);
  const [hasUnknownActor, setHasUnknownActor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    api.get("/admin/audit-logs/filters", { signal: controller.signal })
      .then((response) => {
        if (!response.data?.success) {
          throw new Error(response.data?.message || "Failed to load audit-log filters.");
        }
        setUsers(response.data.data?.users || []);
        setModules(response.data.data?.modules || []);
        setHasUnknownActor(Boolean(response.data.data?.hasUnknownActor));
      })
      .catch((requestError) => {
        if (requestError.code !== "ERR_CANCELED") {
          console.error("Failed to load audit-log filters:", requestError);
          setError("Audit log loaded, but its filter options could not be retrieved.");
        }
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(async () => {
      setLoading(true);
      setError("");
      const params = {
        page,
        pageSize,
        search: search.trim(),
        ...getDateParams(dateRange),
      };
      if (user !== "all") params.accountId = user;
      if (module !== "all") params.targetTable = module;

      try {
        const response = await api.get("/admin/audit-logs", {
          params,
          signal: controller.signal,
        });
        if (!response.data?.success) {
          throw new Error(response.data?.message || "Failed to load audit log.");
        }
        if (active) {
          const result = response.data.data;
          setEntries(result.entries || []);
          setPagination(result.pagination);
          setSelectedId((current) =>
            result.entries.some((entry) => entry.id === current)
              ? current
              : result.entries[0]?.id ?? null,
          );
        }
      } catch (requestError) {
        if (active && requestError.code !== "ERR_CANCELED") {
          console.error("Failed to load audit log:", requestError);
          setEntries([]);
          setError(requestError.response?.data?.message || "Failed to load audit log.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }, search ? 300 : 0);

    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [page, search, user, module, dateRange]);

  const buildQuery = (requestedPage, requestedPageSize) => {
    const params = {
      page: requestedPage,
      pageSize: requestedPageSize,
      search: search.trim(),
      ...getDateParams(dateRange),
    };
    if (user !== "all") params.accountId = user;
    if (module !== "all") params.targetTable = module;
    return params;
  };

  const handleFilterChange = () => {
    setPage(1);
    setSelectedId(null);
  };

  const handlePageChange = (nextPage) => {
    setPage(Math.min(Math.max(nextPage, 1), pagination.pageCount));
    setSelectedId(null);
  };

  const exportLog = async () => {
    setExporting(true);
    try {
      const exportedEntries = [];
      let exportPage = 1;
      let pageCount = 1;
      do {
        const response = await api.get("/admin/audit-logs", {
          params: buildQuery(exportPage, 100),
        });
        if (!response.data?.success) {
          throw new Error(response.data?.message || "Failed to export audit log.");
        }
        exportedEntries.push(...response.data.data.entries);
        pageCount = response.data.data.pagination.pageCount;
        exportPage += 1;
      } while (exportPage <= pageCount);

      const columns = [
        "Event ID",
        "Timestamp",
        "Account ID",
        "Changed by",
        "Role",
        "Database table",
        "Record ID",
        "Action",
        "Old value",
        "New value",
      ];
      const rows = exportedEntries.map((entry) => [
        entry.id,
        entry.createdAt,
        entry.accountId,
        entry.actorName,
        entry.actorRole,
        entry.targetTable,
        entry.targetId,
        entry.action,
        snapshotForCsv(entry.oldValue),
        snapshotForCsv(entry.newValue),
      ]);
      const csv = [columns, ...rows]
        .map((row) => row.map(escapeCsv).join(","))
        .join("\r\n");
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "audit-log.csv";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (exportError) {
      console.error("Failed to export audit log:", exportError);
      setError(exportError.response?.data?.message || "Failed to export audit log.");
    } finally {
      setExporting(false);
    }
  };

  const selectedEntry =
    entries.find((entry) => entry.id === selectedId) ?? entries[0] ?? null;

  return (
    <div className="flex h-screen flex-col bg-[#FBFBFB] p-6 font-sans">
      <Header title="Audit Log" />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Data edit history</h2>
          <p className="mt-1 text-sm text-gray-500">
            Review recorded changes, who made them, and when they occurred.
          </p>
        </div>
        <button
          type="button"
          onClick={exportLog}
          disabled={exporting || pagination.total === 0}
          className="rounded-lg bg-[#38c7e5] px-5 py-2 text-sm font-medium text-white hover:bg-[#27b7d5] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {exporting ? "Exporting..." : "Export log"}
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)]">
        <section className="min-h-0 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <AuditLogFilters
            search={search}
            setSearch={setSearch}
            user={user}
            setUser={setUser}
            module={module}
            setModule={setModule}
            dateRange={dateRange}
            setDateRange={setDateRange}
            users={users}
            modules={modules}
            hasUnknownActor={hasUnknownActor}
            onFilterChange={handleFilterChange}
          />
          {loading && <p className="mb-2 text-xs text-gray-500">Loading audit records...</p>}
          <AuditLogTable
            entries={entries}
            selectedId={selectedId}
            onSelect={(entry) => setSelectedId(entry.id)}
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onPageChange={handlePageChange}
          />
        </section>
        <ChangeDetailsPanel entry={selectedEntry} />
      </div>
    </div>
  );
}
