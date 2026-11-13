const formatDate = (date) => new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default function AuditLogTable({
  entries,
  selectedId,
  onSelect,
  page,
  pageSize,
  total,
  onPageChange,
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const firstItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, total);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-left text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-3 py-3 font-medium">Date &amp; time ↓</th>
              <th className="px-3 py-3 font-medium">Changed by</th>
              <th className="px-3 py-3 font-medium">Module</th>
              <th className="px-3 py-3 font-medium">Record</th>
              <th className="px-3 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="border-t border-gray-100 px-3 py-8 text-center text-sm text-gray-500">
                  No audit records match these filters.
                </td>
              </tr>
            ) : entries.map((entry) => (
              <tr
                key={entry.id}
                tabIndex={0}
                aria-selected={selectedId === entry.id}
                onClick={() => onSelect(entry)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(entry);
                  }
                }}
                className={`cursor-pointer border-t border-gray-100 transition hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#38c7e5] ${selectedId === entry.id ? "bg-sky-50" : "bg-white"}`}
              >
                <td className="px-3 py-3 text-xs text-gray-600">
                  {formatDate(entry.date)}<br />{entry.time}
                </td>
                <td className="px-3 py-3 text-xs text-gray-600">
                  {entry.changedBy}<br />{entry.role}
                </td>
                <td className="px-3 py-3 text-xs text-gray-600">{entry.module}</td>
                <td className="px-3 py-3 text-xs text-gray-600">{entry.record}</td>
                <td className="px-3 py-3 text-xs font-semibold text-[#08a9c5]">{entry.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
        <span>Showing {firstItem}–{lastItem} of {total} changes</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-700">{page}</span>
          <button
            type="button"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
            className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
