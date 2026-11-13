export default function VetTimeOffManagement({
  schedules,
  timeOff,
  draft,
  setDraft,
  onSubmit,
  onBack,
  formatDate,
}) {
  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Manage vet time off</h2>
          <p className="mt-1 text-sm text-gray-500">Block unavailable hours without changing the regular weekly schedule.</p>
        </div>
        <button type="button" onClick={onBack} className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200">Back to schedules</button>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-gray-800">Upcoming time off</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500">
                  <th className="pb-3 pr-3 font-medium">Veterinarian</th>
                  <th className="pb-3 pr-3 font-medium">Date / Time</th>
                  <th className="pb-3 pr-3 font-medium">Reason</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {timeOff.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-4 pr-3 text-gray-700">{item.veterinarian}</td>
                    <td className="py-4 pr-3 text-gray-600">{formatDate(item.date, { month: "short", day: "numeric", year: "numeric" })}<br />{item.time}</td>
                    <td className="py-4 pr-3 text-gray-600">{item.reason}</td>
                    <td className="py-4">
                      <span className={`rounded-md px-2 py-1 text-xs ${item.status === "Approved" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{item.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 rounded-lg bg-sky-50 p-3">
            <p className="text-sm font-semibold text-sky-800">Protect existing appointments</p>
            <p className="mt-1 text-sm text-gray-600">If time off affects booked appointments, reschedule them before confirming the block.</p>
          </div>
        </section>

        <form onSubmit={onSubmit} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-gray-800">Add time off</h3>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-600">
              Veterinarian *
              <select required value={draft.veterinarian} onChange={(event) => setDraft((current) => ({ ...current, veterinarian: event.target.value }))} className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal text-gray-700">
                <option value="">Select veterinarian</option>
                {schedules.map((schedule) => <option key={schedule.vetId} value={schedule.vetId}>{schedule.name}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-gray-600">
              Date *
              <input required type="date" value={draft.date} onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))} className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal text-gray-700" />
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={draft.allDay} onChange={(event) => setDraft((current) => ({ ...current, allDay: event.target.checked }))} className="accent-[#38c7e5]" />
              All day
            </label>
            {!draft.allDay && (
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-medium text-gray-600">Start time *<input required type="time" value={draft.startTime} onChange={(event) => setDraft((current) => ({ ...current, startTime: event.target.value }))} className="mt-1 block w-full rounded-lg border border-gray-200 px-2 py-2 text-sm font-normal text-gray-700" /></label>
                <label className="text-sm font-medium text-gray-600">End time *<input required type="time" value={draft.endTime} onChange={(event) => setDraft((current) => ({ ...current, endTime: event.target.value }))} className="mt-1 block w-full rounded-lg border border-gray-200 px-2 py-2 text-sm font-normal text-gray-700" /></label>
              </div>
            )}
            <label className="block text-sm font-medium text-gray-600">
              Reason *
              <select required value={draft.reason} onChange={(event) => setDraft((current) => ({ ...current, reason: event.target.value }))} className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal text-gray-700">
                <option value="">Select reason</option>
                <option>Personal leave</option>
                <option>Training</option>
                <option>Medical leave</option>
                <option>Other</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-gray-600">
              Notes
              <input value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} placeholder="Add a note for the team (optional)" className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal text-gray-700" />
            </label>
          </div>
          <button type="submit" className="mt-3 rounded-lg bg-[#38c7e5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#27b7d5]">Save time off</button>
        </form>
      </div>
    </>
  );
}
