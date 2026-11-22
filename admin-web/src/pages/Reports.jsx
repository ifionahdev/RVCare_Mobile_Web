import { useState, useEffect } from "react";
import api from "../api/axios";
import { Download } from "lucide-react";
import Header from "../components/template/Header";
import DateRangePicker from "../components/reports/DateRangePicker";
import ChartConfig from "../components/reports/ChartConfig";
import AppointmentsReport from "../components/reports/AppointmentsReport";
import UsersReport from "../components/reports/UsersReport";
import PetsReport from "../components/reports/PetsReport";
import VisitsReport from "../components/reports/VisitsReport";
import SuccessToast from "../components/template/SuccessToast.jsx";
import ErrorToast from "../components/template/ErrorToast.jsx";
import socket from "../socket";
import { toApiDate } from "../components/reports/reportComparison";

const getDefaultDateRange = () => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);
  return { start, end };
};

const Reports = () => {
  const [dateRange, setDateRange] = useState(getDefaultDateRange);
  const [isExporting, setIsExporting] = useState(false);
  const [exportToast, setExportToast] = useState(null);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    const refreshReports = () => {
      // Trigger child report re-fetch by changing object reference.
      setDateRange((prev) => ({ ...prev }));
    };

    socket.on("appointments_updated", refreshReports);
    socket.on("pets_updated", refreshReports);
    socket.on("owner_created", refreshReports);
    socket.on("owner_updated", refreshReports);
    socket.on("new_forum_post", refreshReports);
    socket.on("delete_forum_post", refreshReports);

    return () => {
      socket.off("appointments_updated", refreshReports);
      socket.off("pets_updated", refreshReports);
      socket.off("owner_created", refreshReports);
      socket.off("owner_updated", refreshReports);
      socket.off("new_forum_post", refreshReports);
      socket.off("delete_forum_post", refreshReports);
    };
  }, []);

  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };

  const exportToCsv = async () => {
    setIsExporting(true);
    try {
      const response = await api.get("/admin/reports/export-csv", {
        params: {
          startDate: dateRange.start ? toApiDate(dateRange.start) : null,
          endDate: dateRange.end ? toApiDate(dateRange.end) : null,
        },
        responseType: "blob",
      });

      const url = URL.createObjectURL(response.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `raphacare-reports-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);

      setExportToast({
        type: "success",
        message: "CSV report downloaded successfully.",
      });
    } catch (error) {
      console.error("Error exporting report:", error);
      setExportToast({ type: "error", message: "Failed to export report." });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="reports-page bg-gray-50 dark:bg-[#0B0B0B] p-6 print:bg-white print:p-0">
      <style>{`
        @page {
          size: A4 portrait;
          margin: 14mm;
        }

        @media print {
          html, body, #root {
            height: auto !important;
            overflow: visible !important;
            background: #fff !important;
          }
          .admin-layout {
            display: block !important;
            height: auto !important;
            overflow: visible !important;
            background: #fff !important;
          }
          .admin-layout > aside,
          [data-report-controls],
          [data-screen-report-header] {
            display: none !important;
          }
          .admin-layout > main {
            height: auto !important;
            overflow: visible !important;
            padding: 0 !important;
          }
          [data-report-controls] { display: none !important; }
          .reports-page {
            width: 100% !important;
            max-width: none !important;
            background: #fff !important;
            color: #111 !important;
          }
          [data-print-report-header] {
            display: block !important;
            border-bottom: 2px solid #0ea5e9;
            margin-bottom: 22px;
            padding-bottom: 12px;
          }
          #reports-container {
            display: block !important;
          }
          #reports-container > section {
            break-inside: avoid;
            page-break-inside: avoid;
            page-break-before: always;
            margin-bottom: 0 !important;
          }
          #reports-container > section:first-child {
            page-break-before: auto;
          }
          #reports-container section > h2 {
            color: #1f2937 !important;
            border-bottom: 1px solid #d1d5db;
            padding-bottom: 8px;
          }
          #reports-container .bg-white {
            background: #fff !important;
          }
        }
      `}</style>
      {exportToast?.type === "success" && (
        <SuccessToast
          message={exportToast.message}
          onClose={() => setExportToast(null)}
        />
      )}
      {exportToast?.type === "error" && (
        <ErrorToast
          message={exportToast.message}
          onClose={() => setExportToast(null)}
        />
      )}
      <ChartConfig />

      {/* Header */}
      <div data-print-report-header className="hidden">
        <p className="text-sm font-semibold uppercase tracking-widest text-sky-600">
          RaphaCare Clinic Portal
        </p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900">Reports &amp; Analytics</h1>
        <p className="mt-2 text-sm text-gray-600">
          Consolidated operational report
          {dateRange.start && dateRange.end
            ? ` · ${dateRange.start.toLocaleDateString()} – ${dateRange.end.toLocaleDateString()}`
            : " · All available dates"}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Generated {new Date().toLocaleString()}
        </p>
      </div>
      <div data-screen-report-header>
        <Header title="Reports & Analytics" />
      </div>

      <div data-report-controls className="flex justify-end items-center gap-3 mt-4">
        {dateRange.start && dateRange.end && (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Showing data from: {dateRange.start.toLocaleDateString()} to{" "}
            {dateRange.end.toLocaleDateString()}
          </span>
        )}
        <DateRangePicker onRangeChange={handleDateRangeChange} />
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Download size={16} />
          Print / Save PDF
        </button>
        <button
          onClick={exportToCsv}
          disabled={isExporting}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Download size={16} />
          {isExporting ? "Exporting..." : "Export CSV"}
        </button>
      </div>

      {/* Reports container */}
      <div id="reports-container" className="space-y-6">
        <AppointmentsReport dateRange={dateRange} />
        <UsersReport dateRange={dateRange} />
        <PetsReport dateRange={dateRange} />
        <VisitsReport dateRange={dateRange} />
      </div>
    </div>
  );
};

export default Reports;

