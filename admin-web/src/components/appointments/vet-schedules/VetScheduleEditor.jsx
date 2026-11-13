import { Save } from "lucide-react";
import { formatDate, weekdays } from "./vetScheduleData.js";

export default function VetScheduleEditor({
  schedules,
  draft,
  setDraft,
  isEditing,
  onSubmit,
  onCancel,
}) {
  const veterinarian = schedules.find((schedule) => schedule.vetId === draft.vetId);

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">{isEditing ? "Edit vet schedule" : "Add vet schedule"}</h2>
          <p className="mt-1 text-sm text-gray-500">Vet Schedules / Schedule details</p>
        </div>
        <button type="button" onClick={onCancel} className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200">Back to schedules</button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_290px]">
        <form onSubmit={onSubmit} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-gray-800">Schedule details</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium text-gray-600">
              Veterinarian *
              <select required value={draft.vetId} onChange={(event) => setDraft((current) => ({ ...current, vetId: event.target.value }))} className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal text-gray-700">
                {schedules.map((schedule) => <option key={schedule.vetId} value={schedule.vetId}>{schedule.name}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-gray-600">
              Clinic location *
              <select value={draft.location} onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))} className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal text-gray-700">
                <option>Main clinic</option>
                <option>North clinic</option>
              </select>
            </label>
            <label className="text-sm font-medium text-gray-600">
              Start date *
              <input required type="date" value={draft.startDate} onChange={(event) => setDraft((current) => ({ ...current, startDate: event.target.value }))} className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal text-gray-700" />
            </label>
            <label className="text-sm font-medium text-gray-600">
              End date *
              <input required type="date" value={draft.endDate} onChange={(event) => setDraft((current) => ({ ...current, endDate: event.target.value }))} className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal text-gray-700" />
            </label>
            <fieldset className="sm:col-span-2">
              <legend className="mb-2 text-sm font-medium text-gray-600">Repeat on *</legend>
              <div className="flex flex-wrap gap-3">
                {weekdays.map((day, index) => (
                  <label key={day} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={draft.days.includes(index)}
                      onChange={(event) => setDraft((current) => ({
                        ...current,
                        days: event.target.checked
                          ? [...current.days, index].sort()
                          : current.days.filter((dayIndex) => dayIndex !== index),
                      }))}
                      className="accent-[#38c7e5]"
                    />
                    {day.slice(0, 3)}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="text-sm font-medium text-gray-600">
              Start time *
              <input required value={draft.startTime} onChange={(event) => setDraft((current) => ({ ...current, startTime: event.target.value }))} className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal text-gray-700" />
            </label>
            <label className="text-sm font-medium text-gray-600">
              End time *
              <input required value={draft.endTime} onChange={(event) => setDraft((current) => ({ ...current, endTime: event.target.value }))} className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal text-gray-700" />
            </label>
            <label className="text-sm font-medium text-gray-600">
              Break starts
              <input value={draft.breakStart} onChange={(event) => setDraft((current) => ({ ...current, breakStart: event.target.value }))} className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal text-gray-700" />
            </label>
            <label className="text-sm font-medium text-gray-600">
              Break ends
              <input value={draft.breakEnd} onChange={(event) => setDraft((current) => ({ ...current, breakEnd: event.target.value }))} className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal text-gray-700" />
            </label>
            <label className="text-sm font-medium text-gray-600 sm:col-span-2">
              Notes
              <input value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal text-gray-700" />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={onCancel} className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={draft.days.length === 0} className="flex items-center gap-2 rounded-lg bg-[#38c7e5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#27b7d5] disabled:cursor-not-allowed disabled:opacity-50"><Save size={16} /> Save schedule</button>
          </div>
        </form>

        <aside className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="text-base font-semibold text-gray-800">Schedule summary</h3>
          <span className="mt-3 inline-block rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-700">Available for booking</span>
          <p className="mt-3 text-base font-semibold text-gray-800">{veterinarian?.name}</p>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            {formatDate(new Date(`${draft.startDate}T00:00:00`), { month: "long", day: "numeric", year: "numeric" })}
            {" – "}
            {formatDate(new Date(`${draft.endDate}T00:00:00`), { month: "long", day: "numeric", year: "numeric" })}
            <br />{draft.days.map((index) => weekdays[index]).join(", ")}
            <br />{draft.startTime} – {draft.endTime}
            <br />Break: {draft.breakStart || "None"} – {draft.breakEnd || "None"}
            <br />{draft.location}
          </p>
          <div className="mt-4 rounded-lg bg-sky-50 p-3">
            <p className="text-sm font-semibold text-sky-800">No schedule conflicts</p>
            <p className="mt-1 text-sm text-gray-600">This shift does not overlap another shift or approved time off.</p>
          </div>
          <p className="mt-3 text-xs text-gray-500">Appointments can only be booked within the vet’s available hours.</p>
        </aside>
      </div>
    </>
  );
}
