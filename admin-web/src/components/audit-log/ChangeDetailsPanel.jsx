const formatValue = (value) => {
  if (value == null) return "—";
  return typeof value === "string" ? value : JSON.stringify(value);
};

const formatField = (field) =>
  field
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\bId\b/g, "ID")
    .replace(/^./, (letter) => letter.toUpperCase());

const toFields = (value) => {
  if (value == null) return {};
  if (typeof value !== "object" || Array.isArray(value)) return { value };
  return value;
};

const getChanges = (entry) => {
  const before = toFields(entry.oldValue);
  const after = toFields(entry.newValue);
  const fields = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...fields]
    .filter((field) => JSON.stringify(before[field]) !== JSON.stringify(after[field]))
    .map((field) => ({
      field,
      before: formatValue(before[field]),
      after: formatValue(after[field]),
    }));
};

export default function ChangeDetailsPanel({ entry }) {
  if (!entry) {
    return (
      <aside className="flex min-h-[300px] items-center justify-center rounded-2xl border border-gray-100 bg-white p-5 text-center text-sm text-gray-500 shadow-sm">
        Select an audit event to view its change details.
      </aside>
    );
  }

  const changes = getChanges(entry);

  return (
    <aside className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-gray-800">Change details</h3>
      <p className="mt-1 text-xs font-medium text-[#08a9c5]">Event {entry.id} · {entry.action}</p>
      <p className="mt-3 text-sm font-semibold text-gray-800">{entry.actorName} · {entry.actorRole}</p>
      <p className="text-xs text-gray-600">{new Date(entry.createdAt).toLocaleString()}</p>

      <div className="mt-4 rounded-lg bg-gray-50 p-3">
        <p className="text-xs text-gray-500">{entry.module}</p>
        <p className="mt-1 text-sm font-semibold text-gray-800">
          Record #{entry.targetId}
        </p>
      </div>

      <p className="mb-2 mt-4 text-sm font-semibold text-gray-800">
        {changes.length} {changes.length === 1 ? "field" : "fields"} changed
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
            {changes.map((change) => (
              <tr key={change.field} className="border border-gray-100">
                <td className="px-2 py-2 font-medium text-gray-700">{formatField(change.field)}</td>
                <td className="px-2 py-2 text-gray-500">{change.before}</td>
                <td className="px-2 py-2 text-emerald-700">{change.after}</td>
              </tr>
            ))}
            {changes.length === 0 && (
              <tr>
                <td colSpan={3} className="px-2 py-3 text-gray-500">
                  No field snapshots were recorded for this event.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
        <p>Read-only history · Values recorded in the database audit log</p>
      </div>
    </aside>
  );
}
