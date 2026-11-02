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
import FeedbacksReport from "../components/reports/FeedbacksReport";
import LostPetsReport from "../components/reports/LostPetsReport";
import SuccessToast from "../components/template/SuccessToast.jsx";
import ErrorToast from "../components/template/ErrorToast.jsx";
import socket from "../socket";
import { toApiDate } from "../components/reports/reportComparison";

const Reports = () => {
  const [dateRange, setDateRange] = useState({ start: null, end: null });
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
    console.log("Date range changed:", range);
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      console.log(
        "📤 Calling:",
        api.defaults.baseURL + "/admin/reports/export-pdf",
      );

      const response = await api.post(
        "/admin/reports/export-pdf",
        {
          startDate: dateRange.start ? toApiDate(dateRange.start) : null,
          endDate: dateRange.end ? toApiDate(dateRange.end) : null,
        },
        { responseType: "blob" },
      );

      const url = URL.createObjectURL(response.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `raphaVets-reports-${new Date().toISOString().split("T")[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      setExportToast({
        type: "success",
        message: "PDF exported successfully!",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      setExportToast({ type: "error", message: "Failed to generate PDF." });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-[#0B0B0B] p-6">
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
      <Header title="Reports & Analytics" />

      <div className="flex justify-end items-center gap-3 mt-4">
        {dateRange.start && dateRange.end && (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Showing data from: {dateRange.start.toLocaleDateString()} to{" "}
            {dateRange.end.toLocaleDateString()}
          </span>
        )}
        <DateRangePicker onRangeChange={handleDateRangeChange} />
        <button
          onClick={exportToPDF}
          disabled={isExporting}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Download size={16} />
          {isExporting ? "Exporting..." : "Export PDF"}
        </button>
      </div>

      {/* Reports container */}
      <div id="reports-container" className="space-y-6">
        <AppointmentsReport dateRange={dateRange} />
        <UsersReport dateRange={dateRange} />
        <PetsReport dateRange={dateRange} />
        <VisitsReport dateRange={dateRange} />
        <FeedbacksReport dateRange={dateRange} />
        <LostPetsReport dateRange={dateRange} />
      </div>
    </div>
  );
};

export default Reports;

