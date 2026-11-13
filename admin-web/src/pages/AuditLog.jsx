import { useEffect, useMemo, useState } from "react";
import Header from "../components/template/Header.jsx";
import AuditLogFilters from "../components/audit-log/AuditLogFilters.jsx";
import AuditLogTable from "../components/audit-log/AuditLogTable.jsx";
import ChangeDetailsPanel from "../components/audit-log/ChangeDetailsPanel.jsx";
import { auditLogEntries } from "../components/audit-log/auditLogData.js";

const pageSize = 6;

const inSelectedDateRange = (entryDate, range) => {
  if (range === "all") return true;

  const date = new Date(`${entryDate}T00:00:00`);
  const start = range === "last7" ? new Date(2026, 10, 6) : new Date(2026, 10, 1);
  const end = new Date(2026, 10, 12);
  return date >= start && date <= end;
};

const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

export default function AuditLog() {
  const [search, setSearch] = useState("");
  const [user, setUser] = useState("all");
  const [module, setModule] = useState("all");
  const [dateRange, setDateRange] = useState("november");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(auditLogEntries[0]?.id ?? null);

  const users = useMemo(
    () => [...new Set(auditLogEntries.map((entry) => entry.changedBy))],
    [],
  );
  const modules = useMemo(
    () => [...new Set(auditLogEntries.map((entry) => entry.module))],
    [],
  );
  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    return auditLogEntries.filter((entry) => {
      const matchesQuery = !query || [
        entry.id,
        entry.record,
        entry.changedBy,
        entry.module,
        entry.action,
      ].some((value) => value.toLowerCase().includes(query));

      return matchesQuery
        && (user === "all" || entry.changedBy === user)
        && (module === "all" || entry.module === module)
        && inSelectedDateRange(entry.date, dateRange);
    });
  }, [search, user, module, dateRange]);

  const pageCount = Math.max(1, Math.ceil(filteredEntries.length / pageSize));
  const visibleEntries = filteredEntries.slice((page - 1) * pageSize, page * pageSize);
  const selectedEntry = visibleEntries.find((entry) => entry.id === selectedId) ?? null;

  useEffect(() => {
    if (!selectedEntry) {
      setSelectedId(visibleEntries[0]?.id ?? null);
    }
  }, [selectedEntry, visibleEntries]);

  const handleFilterChange = () => {
    setPage(1);
  };

  const handlePageChange = (nextPage) => {
    setPage(Math.min(Math.max(nextPage, 1), pageCount));
  };

  const exportLog = () => {
    const columns = ["Event ID", "Date", "Time", "Changed by", "Role", "Module", "Record", "Action", "Reason"];
    const rows = filteredEntries.map((entry) => [
      entry.id,
      entry.date,
      entry.time,
      entry.changedBy,
      entry.role,
      entry.module,
      entry.record,
      entry.action,
      entry.reason,
    ]);
    const csv = [columns, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "audit-log.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="flex h-screen flex-col bg-[#FBFBFB] p-6 font-sans">
      <Header title="Audit Log" />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Data edit history</h2>
          <p className="mt-1 text-sm text-gray-500">Trace the digital footprint of every record: who changed what, when and where.</p>
        </div>
        <button
          type="button"
          onClick={exportLog}
          className="rounded-lg bg-[#38c7e5] px-5 py-2 text-sm font-medium text-white hover:bg-[#27b7d5]"
        >
          Export log
        </button>
      </div>

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
            onFilterChange={handleFilterChange}
          />
          <AuditLogTable
            entries={visibleEntries}
            selectedId={selectedId}
            onSelect={(entry) => setSelectedId(entry.id)}
            page={page}
            pageSize={pageSize}
            total={filteredEntries.length}
            onPageChange={handlePageChange}
          />
        </section>
        <ChangeDetailsPanel entry={selectedEntry} />
      </div>
      <p className="mt-2 text-xs text-gray-400">Showing sample audit data for the interface preview.</p>
    </div>
  );
}
