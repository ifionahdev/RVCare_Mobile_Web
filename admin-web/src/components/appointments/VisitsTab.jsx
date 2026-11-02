import { Search, Plus, Eye, Trash2 } from "lucide-react";

const formatVisitDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
};

const VisitsTab = ({
  visits,
  searchQuery,
  setSearchQuery,
  visitTypeFilter,
  setVisitTypeFilter,
  isSelectMode,
  selectedVisits,
  navigate,
  getSelectedCount,
  getFilteredData,
  toggleSelectMode,
  toggleSelectAll,
  toggleVisitSelection,
  handleBulkDelete,
  setSelectedAppointment,
  setIsDetailsModalOpen,
  handleSingleDelete,
  visitTypeColors,
  isReadOnly = false,
}) => {
  const addVisitPath = "/admin/visits/add";

  return (
    <div className="mt-">
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

          {/* Visit Type Filter for Visits */}
          <select
            value={visitTypeFilter}
            onChange={(e) => setVisitTypeFilter(e.target.value)}
            className="p-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1B1B1B] text-gray-800 dark:text-gray-200 w-36 focus:outline-none focus:ring-2 focus:ring-[#5EE6FE]/50"
          >
            <option value="All">All Types</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Walk-in">Walk-in</option>
          </select>

          {/* Add Visit Button */}
          {!isReadOnly && (
            <button
              onClick={() => navigate(addVisitPath)}
              className="flex items-center gap-2 px-4 py-2 bg-[#5EE6FE] text-white rounded-xl hover:bg-[#4AD4EC] transition font-medium"
            >
              <Plus className="h-4 w-4" />
              Visit
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
            <th className="p-2 text-sm text-gray-600 dark:text-gray-300">Visit Time</th>
            <th className="p-2 text-sm text-gray-600 dark:text-gray-300">Visit Type</th>
            <th className="p-2 text-sm text-gray-600 dark:text-gray-300">Actions</th>
          </tr>
        </thead>
        <tbody>
          {visits.length === 0 ? (
            <tr>
              <td colSpan={!isReadOnly && isSelectMode ? 9 : 8} className="text-center p-4 text-gray-400">
                No visits found.
              </td>
            </tr>
          ) : (
            visits.map((item) => (
              <tr
                key={item.id}
                className="cursor-pointer hover:bg-[#E5FBFF] dark:hover:bg-[#222] transition"
              >
                {!isReadOnly && isSelectMode && (
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selectedVisits.includes(item.id)}
                      onChange={() => toggleVisitSelection(item.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                )}
                <td className="p-2 text-sm">{item.id}</td>
                <td className="p-2 text-sm">{item.petName}</td>
                <td className="p-2 text-sm">{item.owner}</td>
                <td className="p-2 text-sm">{item.veterinarian || "-"}</td>
                <td className="p-2 text-sm">{formatVisitDate(item.date)}</td>
                <td className="p-2 text-sm">{item.time}</td>
                <td className="p-2 text-sm">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${visitTypeColors[item.visitType]}`}
                  >
                    {item.visitType}
                  </span>
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
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default VisitsTab;
