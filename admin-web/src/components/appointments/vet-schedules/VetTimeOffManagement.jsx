import { Check, Pencil, Trash2, X } from "lucide-react";
import { createEmptyTimeOffDraft, formatTime } from "./vetScheduleData.js";

const statusClass = {
  Approved: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-rose-50 text-rose-700",
  Pending: "bg-amber-50 text-amber-700",
};

export default function VetTimeOffManagement({
  veterinarians,
  timeOptions,
  timeOff,
  draft,
  setDraft,
  isSaving,
  onSubmit,
  onBack,
  onEdit,
  onDelete,
  onStatusChange,
  formatDate,
  minDate,
}) {
  const reasonOptions = ["Personal leave", "Training", "Medical leave", "Other"];
  const startTimes = timeOptions.startTimes;
  const endTimes = timeOptions.endTimes.filter((time) => time > draft.startTime);

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Manage vet time off</h2>
          <p className="mt-1 text-sm text-gray-500">Manage dated unavailability for your veterinary team.</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
        >
          Back to schedules
        </button>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-gray-800">Time off</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] table-fixed text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500">
                  <th className="w-[18%] pb-3 pr-3 font-medium">Veterinarian</th>
                  <th className="w-[24%] pb-3 pr-3 font-medium">Date / Time</th>
                  <th className="w-[18%] pb-3 pr-3 font-medium">Reason</th>
                  <th className="w-[15%] pb-3 pr-3 font-medium">Status</th>
                  <th className="w-[160px] pb-3 pl-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {timeOff.map((item) => (
                  <tr key={item.timeOffId} className="border-b border-gray-50 last:border-0">
                    <td className="py-4 pr-3 text-gray-700">{item.veterinarian}</td>
                    <td className="py-4 pr-3 text-gray-600">
                      {formatDate(item.date, { month: "short", day: "numeric", year: "numeric" })}
                      <br />
                      {item.startTime
                        ? `${formatTime(item.startTime)}–${formatTime(item.endTime)}`
                        : "All day"}
                      {item.note && <span className="block text-xs text-gray-400">{item.note}</span>}
                    </td>
                    <td className="py-4 pr-3 text-gray-600">{item.reason}</td>
                    <td className="py-4 pr-3">
                      <span className={`rounded-md px-2 py-1 text-xs ${statusClass[item.status]}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 pl-2">
                      <div className="flex w-[148px] items-center gap-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          aria-label={`Edit time off for ${item.veterinarian}`}
                          title="Edit"
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
                        >
                          <Pencil size={15} />
                        </button>
                        {item.status === "Pending" && (
                          <>
                            <button
                              type="button"
                              onClick={() => onStatusChange(item, "Approved")}
                              aria-label={`Approve time off for ${item.veterinarian}`}
                              title="Approve"
                              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onStatusChange(item, "Rejected")}
                              aria-label={`Reject time off for ${item.veterinarian}`}
                              title="Reject"
                              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => onDelete(item.timeOffId)}
                          aria-label={`Delete time off for ${item.veterinarian}`}
                          title="Delete"
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {timeOff.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-gray-500">
                      No time off has been added.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 rounded-lg bg-sky-50 p-3">
            <p className="text-sm font-semibold text-sky-800">Protect existing appointments</p>
            <p className="mt-1 text-sm text-gray-600">If time off affects booked appointments, reschedule them before approving the block.</p>
          </div>
        </section>

        <form onSubmit={onSubmit} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-gray-800">
            {draft.timeOffId ? "Edit time off" : "Add time off"}
          </h3>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-600">
              Veterinarian *
              <select
                required
                value={draft.vetId}
                onChange={(event) => setDraft((current) => ({ ...current, vetId: event.target.value }))}
                className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal text-gray-700"
              >
                <option value="">Select veterinarian</option>
                {veterinarians.map((vet) => (
                  <option key={vet.vetId} value={vet.vetId}>{vet.name}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-gray-600">
              Date *
              <input
                required
                type="date"
                min={minDate}
                value={draft.date}
                onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))}
                className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal text-gray-700"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={draft.allDay}
                onChange={(event) => setDraft((current) => {
                  if (event.target.checked) {
                    return { ...current, allDay: true, startTime: "", endTime: "" };
                  }
                  const startTime = timeOptions.startTimes[0] ?? "";
                  const endTime = timeOptions.endTimes.find((time) => time > startTime) ?? "";
                  return { ...current, allDay: false, startTime, endTime };
                })}
                className="accent-[#38c7e5]"
              />
              All day
            </label>
            {!draft.allDay && (
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-medium text-gray-600">
                  Start time *
                  <select
                    required
                    disabled={startTimes.length === 0}
                    value={draft.startTime}
                    onChange={(event) => setDraft((current) => {
                      const startTime = event.target.value;
                      const endTime = current.endTime > startTime
                        ? current.endTime
                        : timeOptions.endTimes.find((time) => time > startTime) ?? "";
                      return { ...current, startTime, endTime };
                    })}
                    className="mt-1 block w-full rounded-lg border border-gray-200 px-2 py-2 text-sm font-normal text-gray-700"
                  >
                    <option value="">Select start time</option>
                    {startTimes.map((time) => (
                      <option key={time} value={time}>{formatTime(time)}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium text-gray-600">
                  End time *
                  <select
                    required
                    disabled={endTimes.length === 0}
                    value={endTimes.includes(draft.endTime) ? draft.endTime : ""}
                    onChange={(event) => setDraft((current) => ({ ...current, endTime: event.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-gray-200 px-2 py-2 text-sm font-normal text-gray-700"
                  >
                    <option value="">Select end time</option>
                    {endTimes.map((time) => (
                      <option key={time} value={time}>{formatTime(time)}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            <label className="block text-sm font-medium text-gray-600">
              Reason *
              <select
                required
                value={draft.reason}
                onChange={(event) => setDraft((current) => ({ ...current, reason: event.target.value }))}
                className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal text-gray-700"
              >
                <option value="">Select reason</option>
                {draft.reason && !reasonOptions.includes(draft.reason) && (
                  <option>{draft.reason}</option>
                )}
                {reasonOptions.map((reason) => <option key={reason}>{reason}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-gray-600">
              Notes
              <input
                maxLength={255}
                value={draft.notes}
                onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Add a note for the team (optional)"
                className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal text-gray-700"
              />
            </label>
            {draft.timeOffId && (
              <label className="block text-sm font-medium text-gray-600">
                Status
                <select
                  value={draft.status}
                  onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal text-gray-700"
                >
                  <option>Pending</option>
                  <option>Approved</option>
                  <option>Rejected</option>
                </select>
              </label>
            )}
          </div>
          <button
            type="submit"
            disabled={isSaving || veterinarians.length === 0}
            className="mt-3 rounded-lg bg-[#38c7e5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#27b7d5] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Saving..." : draft.timeOffId ? "Update time off" : "Save time off"}
          </button>
          {draft.timeOffId && (
            <button
              type="button"
              onClick={() => setDraft(createEmptyTimeOffDraft())}
              className="ml-2 mt-3 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
            >
              Cancel edit
            </button>
          )}
        </form>
      </div>
    </>
  );
}
