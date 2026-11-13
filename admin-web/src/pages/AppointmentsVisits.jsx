import { useState, useEffect } from "react";
import Header from "../components/template/Header";
import { useNavigate } from "react-router-dom";

// Import components
import CalendarTab from "../components/appointments/CalendarTab";
import AppointmentsTab from "../components/appointments/AppointmentsTab";
import VisitsTab from "../components/appointments/VisitsTab";
import RequestsTab from "../components/appointments/RequestsTab";
import VetSchedulesTab from "../components/appointments/VetSchedulesTab";
import AppointmentRequestModal from "../components/appointments/AppointmentRequestModal";
import AppointmentDetailsModal from "../components/appointments/AppointmentDetailsModal";
import DeleteConfirmationModal from "../components/appointments/DeleteConfirmationModal";
import CancelAppointmentModal from "../components/appointments/CancelAppointmentModal";
import SuccessToast from "../components/template/SuccessToast.jsx";
import ErrorToast from "../components/template/ErrorToast.jsx";
import socket from "../socket";

import api from "../api/axios";

const statusColors = {
  Pending: "bg-yellow-300 text-yellow-800",  
  Upcoming: "bg-pink-300 text-pink-800",   
  Completed: "bg-green-300 text-green-800",
  Cancelled: "bg-red-300 text-red-800",
  Missed: "bg-gray-300 text-gray-800",
};

const visitTypeColors = {
  Scheduled: "bg-blue-100 text-blue-800 border border-blue-200",
  "Walk-in": "bg-purple-100 text-purple-800 border border-purple-200",
};

const AppointmentsVisits = () => {
  const [activeTab, setActiveTab] = useState("Calendar");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [visits, setVisits] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [visitTypeFilter, setVisitTypeFilter] = useState("All");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  const [selectedAppointments, setSelectedAppointments] = useState([]);
  const [selectedVisits, setSelectedVisits] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);
  const [visitToDelete, setVisitToDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [showStatusWarningModal, setShowStatusWarningModal] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const isVet = localStorage.getItem("userRole") === "3";
  const navigate = useNavigate();

  const fetchAppointmentData = async () => {
    try {
      const res = await api.get("/admin/appointments");
      const data = res.data;
      const appointments = data.cleanedAppointments;
      const visits = data.cleanedVisits;

      setAppointments(Array.isArray(appointments) ? appointments : []);
      setVisits(Array.isArray(visits) ? visits : []);
    } catch (err) {
      setAppointments([]);
      setVisits([]);
    }
  };

  useEffect(() => {
    fetchAppointmentData();
  }, [])

  useEffect(() => {
    const refreshAppointments = () => {
      fetchAppointmentData();
    };

    if (!socket.connected) {
      socket.connect();
    }

    socket.on("appointments_updated", refreshAppointments);

    return () => {
      socket.off("appointments_updated", refreshAppointments);
    };
  }, []);

  const filteredAppointments = appointments.filter(app => {
    if (activeTab === "Appointments" && app.status === "Pending") return false;
    if (activeTab === "Appointments" && statusFilter !== "All" && app.status !== statusFilter)
      return false;
    return (
      app.petName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.owner?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredVisits = visits.filter(visit => {
    if (visitTypeFilter !== "All" && visit.visitType !== visitTypeFilter)
      return false;
    return (
      visit.petName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      visit.owner.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleViewRequest = (appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    if (isVet) {
      return false;
    }
    try {

      await api.patch("/admin/appointments/status", {
        status: newStatus,
        idsToUpdate: [appointmentId],
      });

      setAppointments(prev => prev.map(app => 
        app.id === appointmentId ? { 
          ...app, 
          status: newStatus
        } : app
      ));
      
      return true;
    } catch (error) {
      console.error("Error updating status:", error);
      return false;
    }
  };

  const requestStatusChange = (idsToUpdate, newStatus) => {
    if (isVet) return;
    if (!newStatus || !Array.isArray(idsToUpdate) || idsToUpdate.length === 0) return;

    setPendingStatusChange({ idsToUpdate, newStatus });
    setShowStatusWarningModal(true);
  };

  const handleStatusChangeWithWarning = (appointmentId, newStatus) => {
    if (isVet) return false;
    requestStatusChange([appointmentId], newStatus);
    return true;
  };

  const handleCancelAppointment = (appointment) => {
    if (isVet) return;
    setAppointmentToCancel(appointment);
    setShowCancelModal(true);
  };

  const toggleSelectMode = () => {
    if (isVet) return;
    setIsSelectMode(!isSelectMode);
    setSelectedAppointments([]);
    setSelectedVisits([]);
  };

  const toggleAppointmentSelection = (appointmentId) => {
    if (isVet) return;
    setSelectedAppointments(prev =>
      prev.includes(appointmentId)
        ? prev.filter(id => id !== appointmentId)
        : [...prev, appointmentId]
    );
  };

  const toggleVisitSelection = (visitId) => {
    if (isVet) return;
    setSelectedVisits(prev =>
      prev.includes(visitId)
        ? prev.filter(id => id !== visitId)
        : [...prev, visitId]
    );
  };

  const toggleSelectAll = () => {
    if (isVet) return;
    if (activeTab === "Appointments") {
      if (selectedAppointments.length === filteredAppointments.length && filteredAppointments.length > 0) {
        setSelectedAppointments([]);
      } else {
        setSelectedAppointments(filteredAppointments.map(app => app.id));
      }
    } else if (activeTab === "Visits") {
      if (selectedVisits.length === filteredVisits.length && filteredVisits.length > 0) {
        setSelectedVisits([]);
      } else {
        setSelectedVisits(filteredVisits.map(visit => visit.id));
      }
    }
  };

  const handleSingleDelete = (item) => {
    if (isVet) return;
    if (activeTab === "Appointments") {
      setAppointmentToDelete([item]);
      setShowDeleteModal(true);
    } else if (activeTab === "Visits") {
      setVisitToDelete([item]);
      setShowDeleteModal(true);
    }
  };

  const handleBulkDelete = () => {
    if (isVet) return;
    if (activeTab === "Appointments" && selectedAppointments.length === 0) return;
    if (activeTab === "Visits" && selectedVisits.length === 0) return;
    
    if (activeTab === "Appointments") {
      const appointmentsToDelete = filteredAppointments.filter(app => 
        selectedAppointments.includes(app.id)
      );
      setAppointmentToDelete(appointmentsToDelete);
      setShowDeleteModal(true);
    } else if (activeTab === "Visits") {
      const visitsToDelete = filteredVisits.filter(visit => 
        selectedVisits.includes(visit.id)
      );
      setVisitToDelete(visitsToDelete);
      setShowDeleteModal(true);
    }
  };

  const handleBulkStatusUpdate = (newStatus) => {
    if (isVet) return;
    if (!newStatus || selectedAppointments.length === 0) return;

    if (newStatus === "Cancelled") {
      const appointmentsToCancel = filteredAppointments.filter(app => 
        selectedAppointments.includes(app.id)
      );
      setAppointmentToCancel(appointmentsToCancel);
      setShowCancelModal(true);
    } else {
      requestStatusChange(selectedAppointments, newStatus);
    }
  };

  const confirmStatusChange = async () => {
    if (isVet || !pendingStatusChange) {
      setShowStatusWarningModal(false);
      setPendingStatusChange(null);
      return;
    }

    const { idsToUpdate, newStatus } = pendingStatusChange;

    try {
      const res = await api.patch("/admin/appointments/status", {
        status: newStatus,
        idsToUpdate,
      });

      const updatedCount = res.data.editedCount || idsToUpdate.length;

      setAppointments((prev) =>
        prev.map((app) =>
          idsToUpdate.includes(app.id) ? { ...app, status: newStatus } : app
        )
      );

      const message = idsToUpdate.length === 1
        ? `Appointment status updated to ${newStatus}!`
        : `${updatedCount} appointments updated to ${newStatus}!`;

      setToast({ type: "success", message });
      setSelectedAppointments([]);
      setIsSelectMode(false);
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to update appointment status.",
      });
    } finally {
      setShowStatusWarningModal(false);
      setPendingStatusChange(null);
    }
  };

  const confirmCancellation = async () => {
    if (isVet) {
      setShowCancelModal(false);
      setAppointmentToCancel(null);
      return;
    }
    if (!appointmentToCancel) {
      setShowCancelModal(false);
      return;
    }

    const idsToUpdate = Array.isArray(appointmentToCancel)
      ? appointmentToCancel.map((app) => app.id)
      : [appointmentToCancel.id];

    try {
      await api.patch("/admin/appointments/status", {
        status: "Cancelled",
        idsToUpdate,
      });

      setToast({
        type: "success",
        message:
          idsToUpdate.length === 1
            ? "Appointment cancelled successfully!"
            : `${idsToUpdate.length} appointments cancelled successfully!`,
      });

      await fetchAppointmentData();
    } catch (error) {
      setToast({ type: "error", message: "Failed to cancel appointment(s)." });
    } finally {
      setShowCancelModal(false);
      setAppointmentToCancel(null);
      setSelectedAppointments([]);
      setIsSelectMode(false);
    }
  };

  const confirmDelete = async () => {
    if (isVet) {
      setShowDeleteModal(false);
      setAppointmentToDelete(null);
      setVisitToDelete(null);
      return;
    }

    if (appointmentToDelete) {
      const idsToDelete = Array.isArray(appointmentToDelete) 
        ? appointmentToDelete.map(app => app.id)
        : [appointmentToDelete.id];
      
      try {
        await api.delete("/admin/appointments/", {
          data: { idsToDelete: idsToDelete},
        });
      } catch (err) {
      }

      setAppointments(prev => prev.filter(app => !idsToDelete.includes(app.id)));
      
      const message = idsToDelete.length === 1 
        ? "Appointment deleted successfully!"
        : `${idsToDelete.length} appointments deleted successfully!`;

      setToast({ type: "success", message });
      setSelectedAppointments([]);
      setIsSelectMode(false);
      fetchAppointmentData();
    }
    
    if (visitToDelete) {
      const idsToDelete = Array.isArray(visitToDelete) 
        ? visitToDelete.map(visit => visit.id)
        : [visitToDelete.id];

      try {
        await api.delete("/admin/appointments/", {
          data: { idsToDelete: idsToDelete},
        });
      } catch (err) {
      }
      
      setVisits(prev => prev.filter(visit => !idsToDelete.includes(visit.id)));
      
      const message = idsToDelete.length === 1 
        ? "Visit deleted successfully!"
        : `${idsToDelete.length} visits deleted successfully!`;
      
      setToast({ type: "success", message });
      setSelectedVisits([]);
      setIsSelectMode(false);
      fetchAppointmentData();
    }
    
    setShowDeleteModal(false);
    setAppointmentToDelete(null);
    setVisitToDelete(null);
  };

  const handleToastClose = () => {
    setToast(null);
  };

  // Filtered Requests
  const filteredRequests = appointments.filter(app => app.status === "Pending");

  const getSelectedCount = () => {
    if (activeTab === "Appointments") return selectedAppointments.length;
    if (activeTab === "Visits") return selectedVisits.length;
    return 0;
  };

  const getFilteredData = () => {
    if (activeTab === "Appointments") return filteredAppointments;
    if (activeTab === "Visits") return filteredVisits;
    return [];
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case "Calendar":
        return (
          <CalendarTab
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            appointments={appointments}
            visits={visits}
          />
        );
      case "Appointments":
        return (
          <AppointmentsTab
            appointments={filteredAppointments}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            isSelectMode={isSelectMode}
            selectedAppointments={selectedAppointments}
            navigate={navigate}
            getSelectedCount={getSelectedCount}
            getFilteredData={getFilteredData}
            toggleSelectMode={toggleSelectMode}
            toggleSelectAll={toggleSelectAll}
            toggleAppointmentSelection={toggleAppointmentSelection}
            handleBulkStatusUpdate={handleBulkStatusUpdate}
            handleBulkDelete={handleBulkDelete}
            setSelectedAppointment={setSelectedAppointment}
            setIsDetailsModalOpen={setIsDetailsModalOpen}
            handleSingleDelete={handleSingleDelete}
            handleCancelAppointment={handleCancelAppointment}
            handleUpdateStatus={handleStatusChangeWithWarning}
            statusColors={statusColors}
            isReadOnly={isVet}
          />
        );
      case "Visits":
        return (
          <VisitsTab
            visits={filteredVisits}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            visitTypeFilter={visitTypeFilter}
            setVisitTypeFilter={setVisitTypeFilter}
            isSelectMode={isSelectMode}
            selectedVisits={selectedVisits}
            navigate={navigate}
            getSelectedCount={getSelectedCount}
            getFilteredData={getFilteredData}
            toggleSelectMode={toggleSelectMode}
            toggleSelectAll={toggleSelectAll}
            toggleVisitSelection={toggleVisitSelection}
            handleBulkDelete={handleBulkDelete}
            setSelectedAppointment={setSelectedAppointment}
            setIsDetailsModalOpen={setIsDetailsModalOpen}
            handleSingleDelete={handleSingleDelete}
            visitTypeColors={visitTypeColors}
            isReadOnly={isVet}
          />
        );
      case "Requests":
        if (isVet) return null;
        return (
          <RequestsTab
            filteredRequests={filteredRequests}
            handleViewRequest={handleViewRequest}
          />
        );
      case "Vet Schedules":
        if (isVet) return null;
        return <VetSchedulesTab />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#FBFBFB] p-6 font-sans">
      <Header title="Appointments, Visits & Vet Schedules" />

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-2 relative">
        {[
          "Calendar",
          "Visits",
          "Appointments",
          ...(isVet ? [] : ["Requests", "Vet Schedules"]),
        ].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative px-5 py-2 font-semibold text-sm transition-colors ${
              activeTab === tab
                ? "text-[#5EE6FE]"
                : "text-gray-600 hover:text-[#5EE6FE]"
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{tab}</span>
              {tab === "Requests" && filteredRequests.length > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                  {filteredRequests.length}
                </span>
              )}
            </div>
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 w-full h-1 bg-[#5EE6FE] rounded-t-lg" />
            )}
          </button>
        ))}
      </div>

      {renderActiveTab()}

      {/* Modals */}
      {isModalOpen && selectedAppointment?.status === "Pending" && (
        <AppointmentRequestModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          appointment={selectedAppointment}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {isDetailsModalOpen && selectedAppointment && (
        <AppointmentDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          appointment={selectedAppointment}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setAppointmentToDelete(null);
            setVisitToDelete(null);
          }}
          onConfirm={confirmDelete}
          appointments={appointmentToDelete || visitToDelete}
          type={appointmentToDelete ? "appointment" : "visit"}
        />
      )}

      {/* Cancel Appointment Modal */}
      {showCancelModal && (
        <CancelAppointmentModal
          isOpen={showCancelModal}
          onClose={() => {
            setShowCancelModal(false);
            setAppointmentToCancel(null);
          }}
          onConfirm={confirmCancellation}
          appointment={appointmentToCancel}
        />
      )}

      {/* Status Change Warning Modal */}
      {showStatusWarningModal && pendingStatusChange && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirm Status Change</h3>
            <p className="text-sm text-gray-600 mb-5">
              {pendingStatusChange.idsToUpdate.length === 1
                ? `Are you sure you want to change this appointment status to ${pendingStatusChange.newStatus}?`
                : `Are you sure you want to change ${pendingStatusChange.idsToUpdate.length} appointments to ${pendingStatusChange.newStatus}?`}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowStatusWarningModal(false);
                  setPendingStatusChange(null);
                }}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
              >
                No, Keep Current
              </button>
              <button
                onClick={confirmStatusChange}
                className="px-4 py-2 rounded-lg bg-[#5EE6FE] text-white hover:bg-[#4AD4EC] transition"
              >
                Yes, Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {toast?.type === "success" && (
        <SuccessToast 
          message={toast.message} 
          onClose={handleToastClose}
        />
      )}

      {/* Error Toast */}
      {toast?.type === "error" && (
        <ErrorToast
          message={toast.message}
          onClose={handleToastClose}
        />
      )}
    </div>
  );
};

export default AppointmentsVisits;
