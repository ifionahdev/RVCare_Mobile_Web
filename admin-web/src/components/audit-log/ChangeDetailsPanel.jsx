const formatDate = (date) => new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export default function ChangeDetailsPanel({ entry }) {
  if (!entry) {
    return (
      <aside className="flex min-h-[300px] items-center justify-center rounded-2xl border border-gray-100 bg-white p-5 text-center text-sm text-gray-500 shadow-sm">
        Select an audit event to view its change details.
      </aside>
    );
  }

  return (
    <aside className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-gray-800">Change details</h3>
      <p className="mt-1 text-xs font-medium text-[#08a9c5]">Event {entry.id} · {entry.action}</p>
      <p className="mt-3 text-sm font-semibold text-gray-800">{entry.changedBy} · {entry.role}</p>
      <p className="text-xs text-gray-600">{formatDate(entry.date)} at {entry.time}</p>
      <p className="mt-1 text-xs text-gray-500">Clinic time · UTC+08:00</p>

      <div className="mt-4 rounded-lg bg-gray-50 p-3">
        <p className="text-xs text-gray-500">{entry.module}</p>
        <p className="mt-1 text-sm font-semibold text-gray-800">{entry.record}</p>
      </div>

      <p className="mb-2 mt-4 text-sm font-semibold text-gray-800">
        {entry.changes.length} {entry.changes.length === 1 ? "field" : "fields"} changed
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[260px] text-left text-xs">
          <thead>
            <tr className="text-gray-500">
              <th className="pb-2 font-medium">Field</th>
              <th className="pb-2 font-medium">Before</th>
              <th className="pb-2 font-medium">After</th>
            </tr>
          </thead>
          <tbody>
            {entry.changes.map((change) => (
              <tr key={change.field} className="border border-gray-100">
                <td className="px-2 py-2 font-medium text-gray-700">{change.field}</td>
                <td className="px-2 py-2 text-gray-500">{change.before}</td>
                <td className="px-2 py-2 text-emerald-700">{change.after}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold text-gray-700">Reason for edit</p>
        <p className="mt-1 text-xs leading-5 text-gray-600">{entry.reason}</p>
      </div>

      <div className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
        <p>IP address: {entry.ipAddress} · Web portal</p>
        <p className="mt-1">Read-only history · Original values preserved</p>
      </div>
    </aside>
  );
}
