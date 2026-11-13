import { Save } from "lucide-react";
import { formatTime, weekdays } from "./vetScheduleData.js";

export default function VetScheduleEditor({
  veterinarians,
  schedules,
  timeOptions,
  draft,
  setDraft,
  isEditing,
  isSaving,
  onSubmit,
  onCancel,
}) {
  const veterinarian = veterinarians.find(
    (item) => String(item.vetId) === String(draft.vetId),
  );
  const existingDays = isEditing
    ? []
    : schedules
        .filter((schedule) => String(schedule.vetId) === String(draft.vetId))
        .map((schedule) => schedule.dayOfWeek);
  const startTimes = timeOptions.startTimes;
  const endTimes = timeOptions.endTimes.filter((time) => time > draft.startTime);

  const toggleDay = (dayOfWeek, checked) => {
    setDraft((current) => {
      if (isEditing) {
        return { ...current, days: checked ? [dayOfWeek] : [] };
      }

      const days = checked
        ? [...current.days, dayOfWeek]
        : current.days.filter((day) => day !== dayOfWeek);
      return { ...current, days: days.sort((a, b) => a - b) };
    });
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            {isEditing ? "Edit vet schedule" : "Add vet schedule"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Set a recurring weekly shift for the selected veterinarian.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
        >
          Back to schedules
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_290px]">
        <form onSubmit={onSubmit} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-gray-800">Schedule details</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium text-gray-600">
              Veterinarian *
              <select
                required
                value={draft.vetId}
                onChange={(event) => {
                  const vetId = event.target.value;
                  const days = schedules
                    .filter((schedule) => String(schedule.vetId) === String(vetId))
                    .map((schedule) => schedule.dayOfWeek);
                  setDraft((current) => ({
                    ...current,
                    vetId,
                    days: isEditing ? current.days : days,
                  }));
                }}
                className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal text-gray-700"
              >
                <option value="">Select veterinarian</option>
                {veterinarians.map((vet) => (
                  <option key={vet.vetId} value={vet.vetId}>{vet.name}</option>
                ))}
              </select>
            </label>

            <fieldset className="sm:col-span-2">
              <legend className="mb-2 text-sm font-medium text-gray-600">
                {isEditing ? "Weekday *" : "Repeat on *"}
              </legend>
              {!isEditing && existingDays.length > 0 && (
                <p className="mb-2 text-xs text-gray-500">
                  Existing weekdays are preselected. Choose any additional days to add.
                </p>
              )}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                {weekdays.map((day, index) => {
                  const dayOfWeek = index + 1;
                  const alreadyScheduled = existingDays.includes(dayOfWeek);
                  const selected = alreadyScheduled || draft.days.includes(dayOfWeek);
                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={alreadyScheduled}
                      aria-pressed={selected}
                      title={alreadyScheduled ? `${day} already has a schedule` : undefined}
                      onClick={() => toggleDay(dayOfWeek, !selected)}
                      className={`min-h-12 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#38c7e5] focus:ring-offset-1 disabled:cursor-not-allowed ${
                        alreadyScheduled
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : selected
                          ? "border-[#25b6d2] bg-[#e8faff] text-[#087f96]"
                          : "border-gray-200 bg-white text-gray-600 hover:border-[#8cdeec] hover:bg-sky-50"
                      }`}
                    >
                      <span className="block">{day}</span>
                      {alreadyScheduled && <span className="block text-[10px] font-medium">Already set</span>}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <label className="text-sm font-medium text-gray-600">
              Start time *
              <select
                required
                disabled={startTimes.length === 0}
                value={startTimes.includes(draft.startTime) ? draft.startTime : ""}
                onChange={(event) => setDraft((current) => {
                  const startTime = event.target.value;
                  const endTime = current.endTime > startTime
                    ? current.endTime
                    : timeOptions.endTimes.find((time) => time > startTime) ?? "";
                  return { ...current, startTime, endTime };
                })}
                className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal text-gray-700"
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
                className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal text-gray-700"
              >
                <option value="">Select end time</option>
                {endTimes.map((time) => (
                  <option key={time} value={time}>{formatTime(time)}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-gray-600 sm:col-span-2">
              Notes
              <input
                maxLength={255}
                value={draft.note}
                onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))}
                className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal text-gray-700"
              />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                draft.days.length === 0 ||
                (!isEditing && draft.days.every((day) => existingDays.includes(day))) ||
                isSaving ||
                veterinarians.length === 0 ||
                !draft.startTime ||
                !draft.endTime
              }
              className="flex items-center gap-2 rounded-lg bg-[#38c7e5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#27b7d5] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={16} /> {isSaving ? "Saving..." : "Save schedule"}
            </button>
          </div>
        </form>

        <aside className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="text-base font-semibold text-gray-800">Schedule summary</h3>
          <span className="mt-3 inline-block rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
            Recurring weekly availability
          </span>
          <p className="mt-3 text-base font-semibold text-gray-800">{veterinarian?.name || "Select a veterinarian"}</p>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            {draft.days.map((day) => weekdays[day - 1]).join(", ") || "Select at least one weekday"}
            <br />{formatTime(draft.startTime) || "--"} – {formatTime(draft.endTime) || "--"}
            {draft.note && <><br />{draft.note}</>}
          </p>
          <p className="mt-4 rounded-lg bg-sky-50 p-3 text-sm text-gray-600">
            Each veterinarian can have one weekly shift per weekday.
          </p>
        </aside>
      </div>
    </>
  );
}
