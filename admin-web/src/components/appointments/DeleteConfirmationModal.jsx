const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, appointments, type = "appointment" }) => {
  if (!isOpen) return null;

  const isBulkDelete = Array.isArray(appointments) && appointments.length > 1;
  const appointmentCount = isBulkDelete ? appointments.length : 1;
  const itemType = type === "visit" ? "visit" : "appointment";
  const itemTypePlural = type === "visit" ? "visits" : "appointments";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-gray-200 p-6">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-500 text-lg">⚠️</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {isBulkDelete ? `Delete ${appointmentCount} ${itemTypePlural}` : `Delete ${itemType}`}
            </h2>
            <p className="text-gray-500 text-sm mt-1">This action cannot be undone</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            {isBulkDelete 
              ? `Are you sure you want to delete ${appointmentCount} selected ${itemTypePlural}? This action cannot be undone.`
              : `Are you sure you want to delete the ${itemType} for "${appointments[0]?.petName}"? This action cannot be undone.`
            }
          </p>
          
          {isBulkDelete && (
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Selected {itemTypePlural}:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {appointments.slice(0, 5).map((app, index) => (
                  <li key={app.id} className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                    {app.petName} - {app.owner} ({app.date})
                  </li>
                ))}
                {appointments.length > 5 && (
                  <li className="text-gray-500 text-xs">
                    ...and {appointments.length - 5} more
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-200 p-6">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition font-medium"
          >
            {isBulkDelete ? `Delete ${appointmentCount} ${itemTypePlural}` : `Delete ${itemType}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;