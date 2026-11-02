import { useState } from "react";
import SuccessToast from "../template/SuccessToast.jsx";

const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
};

const AppointmentRequestModal = ({ isOpen, onClose, appointment, onUpdateStatus }) => {
  const [loading, setLoading] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [toast, setToast] = useState(null);

  if (!isOpen || !appointment) return null;

  const confirmApprove = async () => {
    setLoading(true);
    try {
      // ✅ REMOVED the direct API call - let parent handle it
      if (onUpdateStatus) {
        await onUpdateStatus(appointment.id, "Upcoming");
      }
      
      setToast({ type: "success", message: "Appointment approved successfully!" });
      setShowApproveConfirm(false);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error approving appointment:", error);
    } finally {
      setLoading(false);
    }
  };

  const confirmReject = async () => {
    setLoading(true);
    try {
      // ✅ REMOVED the direct API call - let parent handle it
      if (onUpdateStatus) {
        await onUpdateStatus(appointment.id, "Rejected");
      } 
      
      setToast({ type: "success", message: "Appointment rejected successfully!" });
      setShowRejectConfirm(false);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error rejecting appointment:", error);
    } finally {
      setLoading(false);
    }
  };


  const handleToastClose = () => {
    setToast(null);
  };

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 overflow-y-auto">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl my-8">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-gray-200 p-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Appointment Request</h2>
              <p className="text-gray-500 text-sm mt-1">Review appointment details</p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition text-xl"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-2 max-h-[65vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column */}
              <div className="space-y-4">
                {/* Pet Information */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Pet Information</h3>
                  <div className="flex items-start gap-3">
                    <img 
                      src="/images/dog-profile.png" 
                      alt={appointment.petName}
                      className="w-16 h-16 rounded-xl object-cover border border-gray-200"
                    />
                    <div>
                      <h4 className="font-bold text-gray-800">{appointment.petName}</h4>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm">
                        <div>
                          <span className="text-gray-500">Breed:</span>
                          <p className="font-medium text-gray-700">{appointment.breedName}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Age:</span>
                          <p className="font-medium text-gray-700">{appointment.petAge}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Sex:</span>
                          <p className="font-medium text-gray-700">{appointment.petSex}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Weight:</span>
                          <p className="font-medium text-gray-700">
                            {appointment.weight != null ? `${appointment.weight} kg` : "Not available"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Owner Information */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Owner Information</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <p className="font-medium text-gray-700">{appointment.owner}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Phone:</span>
                      <p className="font-medium text-gray-700">{appointment.phone || "Not available"}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <p className="font-medium text-gray-700 break-all">{appointment.email || "Not available"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Service Information */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Service Details</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Service Type:</span>
                      <p className="font-medium text-gray-700">{appointment.serviceType || "Not specified"}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Description:</span>
                      <p className="font-medium text-gray-700">{appointment.description || "No description"}</p>
                    </div>
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Appointment Schedule</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date:</span>
                      <span className="font-medium text-gray-700">{formatDate(appointment.date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Time:</span>
                      <span className="font-medium text-gray-700">{appointment.time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 border-t border-gray-200 p-6">
            <button 
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition font-medium"
            >
              Close
            </button>
            <button 
              onClick={() => setShowRejectConfirm(true)}
              className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition font-medium"
            >
              Reject
            </button>
            <button 
              onClick={() => setShowApproveConfirm(true)}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition font-medium disabled:opacity-50"
            >
              {loading ? "Approving..." : "Approve"}
            </button>
          </div>
        </div>
      </div>

      {/* Approve Confirmation Modal */}
      {showApproveConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirm Approval</h3>
            <p className="text-gray-600 text-sm mb-4">
              Are you sure you want to approve this appointment?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowApproveConfirm(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmApprove}
                className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {showRejectConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirm Rejection</h3>
            <p className="text-gray-600 text-sm mb-4">
              Are you sure you want to reject this appointment?
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowRejectConfirm(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button 
                onClick={confirmReject}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
              >
                Reject
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
    </>
  );
};

export default AppointmentRequestModal;