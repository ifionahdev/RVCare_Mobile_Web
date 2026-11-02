const AppointmentDetailsModal = ({ isOpen, onClose, appointment }) => {
  if (!isOpen || !appointment) return null;

  const title = appointment.visitType === "Walk-in" ? "Visit Details" : "Appointment Details";
  const ageLabel = appointment.petAge || "Unknown";
  const petLine = [appointment.breedName, ageLabel, appointment.petSex].filter(Boolean).join(" - ");

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-800";
      case "Ongoing": return "bg-blue-100 text-blue-800";
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "Cancelled": return "bg-red-100 text-red-800";
      case "Rejected": return "bg-red-100 text-red-800";
      case "Upcoming": return "bg-pink-100 text-pink-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl my-8">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-200 p-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
            <p className="text-gray-500 text-sm mt-1">View full schedule and patient information</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition text-xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Pet & Owner Info */}
            <div className="space-y-4">
              {/* Pet Information */}
              <div className="border border-gray-200 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Pet Information</h3>
                <div className="flex items-center gap-3">
                  <img 
                    src="/images/dog-profile.png" 
                    alt={appointment.petName}
                    className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                  />
                  <div>
                    <h4 className="font-bold text-gray-800">{appointment.petName}</h4>
                    <p className="text-gray-500 text-sm">{petLine || "No additional pet details"}</p>
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

            {/* Service & Appointment Info */}
            <div className="space-y-4">
              {/* Service Information */}
              <div className="border border-gray-200 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Service Information</h3>
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
                <h3 className="font-semibold text-gray-800 mb-3">Appointment Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date:</span>
                    <span className="font-medium text-gray-700">{appointment.date || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Visit Time:</span>
                    <span className="font-medium text-gray-700">{appointment.time || appointment.scheduledTime || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type:</span>
                    <span className="font-medium text-gray-700">{appointment.visitType || "Scheduled"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-gray-200 p-6">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailsModal;