import { Search, Plus, Eye, Trash2 } from "lucide-react";

const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
};

const AppointmentsTab = ({
  appointments,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  isSelectMode,
  selectedAppointments,
  navigate,
  getSelectedCount,
  getFilteredData,
  toggleSelectMode,
  toggleSelectAll,
  toggleAppointmentSelection,
  handleBulkStatusUpdate,
  handleBulkDelete,
  setSelectedAppointment,
  setIsDetailsModalOpen,
  handleSingleDelete,
  handleCancelAppointment,
  handleUpdateStatus,
  statusColors,
  isReadOnly = false,
}) => {
  const addAppointmentPath = "/admin/appointments/add";

  return (
    <div className="">
      {/* Search & Filter with New Select Controls */}
      <div className="flex gap-2 mb-4 flex-wrap items-center justify-between">
        <div className="flex gap-2 items-center">
          {/* Search Bar */}
          <div className="relative w-full max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search pets or owners..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 p-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1B1B1B] text-gray-800 dark:text-gray-200 w-full focus:outline-none focus:ring-2 focus:ring-[#5EE6FE]/50"
            />
          </div>

          {/* Status Filter for Appointments */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1B1B1B] text-gray-800 dark:text-gray-200 w-36 focus:outline-none focus:ring-2 focus:ring-[#5EE6FE]/50"
          >
            <option value="All">All Status</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Missed">Missed</option>
          </select>

          {/* Add Button */}
          {!isReadOnly && (
            <button
              onClick={() => navigate(addAppointmentPath)}
              className="flex items-center gap-2 px-4 py-2 bg-[#5EE6FE] text-white rounded-xl hover:bg-[#4AD4EC] transition font-medium"
            >
              <Plus className="h-4 w-4" />
              Appointment
            </button>
          )}
        </div>

        {/* Selection Controls */}
        <div className="flex gap-2 items-center">
          {!isReadOnly && isSelectMode ? (
            <>
              <span className="text-sm text-gray-600">
                {getSelectedCount()} selected
              </span>
              
              {/* Bulk Status Update Dropdown for Appointments */}
              {selectedAppointments.length > 0 && (
                <div className="relative">
                  <select
                    onChange={(e) => handleBulkStatusUpdate(e.target.value)}
                    className="px-3 py-2 text-sm rounded-xl border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8"
                  >
                    <option value="">Update Status</option>
                    <option value="Upcoming">Mark as Upcoming</option>
                    <option value="Completed">Mark as Completed</option>
                    <option value="Cancelled">Mark as Cancelled</option>
                    <option value="Missed">Mark as Missed</option>
                  </select>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Bulk Delete Button */}
              {getSelectedCount() > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition font-medium text-sm"
                >
                  Delete Selected ({getSelectedCount()})
                </button>
              )}
              
              <button
                onClick={toggleSelectMode}
                className="px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition font-medium text-sm"
              >
                Cancel
              </button>
            </>
          ) : !isReadOnly ? (
            <button
              onClick={toggleSelectMode}
              className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition font-medium text-sm"
            >
              Select
            </button>
          ) : null}
        </div>
      </div>

      <div className="max-h-[500px] overflow-auto rounded-xl border border-gray-200 dark:border-gray-700 pb-8">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100 dark:bg-[#1B1B1B] sticky top-0">
            <tr>
              {!isReadOnly && isSelectMode && (
                <th className="p-2 text-sm text-gray-600 dark:text-gray-300 w-12">
                  <input
                    type="checkbox"
                    checked={getSelectedCount() === getFilteredData().length && getFilteredData().length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
              )}
              <th className="p-2 text-sm text-gray-600 dark:text-gray-300">ID</th>
              <th className="p-2 text-sm text-gray-600 dark:text-gray-300">Pet</th>
              <th className="p-2 text-sm text-gray-600 dark:text-gray-300">Owner</th>
              <th className="p-2 text-sm text-gray-600 dark:text-gray-300">Veterinarian</th>
              <th className="p-2 text-sm text-gray-600 dark:text-gray-300">Date</th>
              <th className="p-2 text-sm text-gray-600 dark:text-gray-300">Scheduled Time</th>
              <th className="p-2 text-sm text-gray-600 dark:text-gray-300">Status</th>
              <th className="p-2 text-sm text-gray-600 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 ? (
              <tr>
                <td colSpan={!isReadOnly && isSelectMode ? 9 : 8} className="text-center p-4 text-gray-400">
                  No appointments found.
                </td>
              </tr>
            ) : (
              appointments.map((item) => {
                const isEditable = item.status === "Upcoming" || item.status === "Pending";
                
                return (
                  <tr
                    key={item.id}
                    className="cursor-pointer hover:bg-[#E5FBFF] dark:hover:bg-[#222] transition"
                  >
                    {!isReadOnly && isSelectMode && (
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={selectedAppointments.includes(item.id)}
                          onChange={() => toggleAppointmentSelection(item.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                    )}
                    <td className="p-2 text-sm">{item.id}</td>
                    <td className="p-2 text-sm">{item.petName}</td>
                    <td className="p-2 text-sm">{item.owner}</td>
                    <td className="p-2 text-sm">{item.veterinarian || "-"}</td>
                    <td className="p-2 text-sm">{formatDate(item.date)}</td>
                    <td className="p-2 text-sm">{item.time}</td>
                    <td className="p-2 text-sm">
                      {!isReadOnly && isEditable ? (
                        <select
                          value={item.status}
                          onChange={(e) => {
                            if (e.target.value === "Cancelled") {
                              handleCancelAppointment(item);
                            } else {
                              // This would typically update the appointment status
                              handleUpdateStatus(item.id, e.target.value);
                            }
                          }}
                          className={`p-1 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 ${
                            item.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : item.status === "Upcoming"
                              ? "bg-pink-100 text-pink-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          <option value="Upcoming">Upcoming</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            item.status === "Completed"
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : "bg-red-100 text-red-800 border border-red-200"
                          }`}
                        >
                          {item.status}
                        </span>
                      )}
                    </td>
                    <td className="p-2 text-sm flex gap-2">
                      <Eye
                        size={18}
                        className="text-blue-500 cursor-pointer hover:text-blue-600"
                        onClick={() => {
                          setSelectedAppointment(item);
                          setIsDetailsModalOpen(true);
                        }}
                      />
                      {!isReadOnly && (
                        <Trash2
                          size={18}
                          className="text-red-500 cursor-pointer hover:text-red-600"
                          onClick={() => handleSingleDelete(item)}
                        />
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AppointmentsTab;
