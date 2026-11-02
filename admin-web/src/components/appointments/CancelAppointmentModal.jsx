import { useState } from "react";
import api from "../../api/axios"

const CancelAppointmentModal = ({ isOpen, onClose, onConfirm, appointment }) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const isBulkCancel = Array.isArray(appointment) && appointment.length > 1;
  const appointmentCount = isBulkCancel ? appointment.length : 1;

  const handleConfirm = async () => {
    if(!appointment) return;
    setLoading(true);
    try {
      const idsToCancel = Array.isArray(appointment)
        ? appointment.map(apt => apt.id)
        : [appointment.id];

      await api.patch("/admin/appointments/status", {status: "Cancelled", idsToUpdate: idsToCancel});
      onConfirm();
    } catch (error) {
      console.error("Error cancelling appointment:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-gray-200 p-6">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <span className="text-orange-500 text-lg">⚠️</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {isBulkCancel ? `Cancel ${appointmentCount} Appointments` : 'Cancel Appointment'}
            </h2>
            <p className="text-gray-500 text-sm mt-1">Confirm cancellation</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 text-sm mb-4">
            {isBulkCancel 
              ? `Are you sure you want to cancel ${appointmentCount} selected appointments? This action cannot be undone.`
              : `Are you sure you want to cancel the appointment for <strong>${appointment.petName}</strong>? This action cannot be undone.`
            }
          </p>
          
          {!isBulkCancel && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
              <div className="text-sm text-gray-600 space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Pet:</span>
                  <span>{appointment.petName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Owner:</span>
                  <span>{appointment.owner}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Date & Time:</span>
                  <span>{appointment.date} at {appointment.time}</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-800 text-xs flex items-start gap-2">
              <span className="text-yellow-500">💡</span>
              <span>This action will notify the pet owner about the cancellation.</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-200 p-6">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition font-medium"
          >
            Keep Appointment
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-6 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed min-w-20"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Cancelling...
              </span>
            ) : (
              isBulkCancel ? 'Cancel All' : 'Confirm'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelAppointmentModal;