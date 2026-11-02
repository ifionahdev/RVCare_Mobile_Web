const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
};

const RequestsTab = ({ filteredRequests, handleViewRequest }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 pr-2 pb-2 overflow-y-auto">
      {filteredRequests.length === 0 ? (
        <p className="text-gray-400 text-center col-span-2">No pending requests.</p>
      ) : (
        filteredRequests.map((req) => (
          <div
            key={req.id}
            className="p-4 rounded-2xl bg-white dark:bg-gray-800 shadow-md flex flex-col gap-2 border border-[#E6F7FA]"
          >
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <p className="font-semibold text-gray-700 dark:text-gray-200 text-sm">{req.petName}</p>
                <p className="text-gray-500 dark:text-gray-400 text-xs">Owner: {req.owner}</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs">{formatDate(req.date)} • {req.time}</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 shadow-sm">
                Pending
              </span>
            </div>

            <button
              onClick={() => handleViewRequest(req)}
              className="mt-2 py-1 rounded-xl bg-blue-100 text-blue-800 font-semibold hover:bg-blue-200 transition"
            >
              View
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default RequestsTab;
