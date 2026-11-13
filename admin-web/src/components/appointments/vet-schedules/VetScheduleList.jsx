import { Plus } from "lucide-react";
import { addDays, formatDate, toDateInput, weekdays } from "./vetScheduleData.js";

export default function VetScheduleList({
  schedules,
  visibleSchedules,
  weekDays,
  weekStart,
  weekLabel,
  selectedVet,
  setSelectedVet,
  scheduleStatus,
  setScheduleStatus,
  onWeekStartChange,
  onAddSchedule,
  onManageTimeOff,
  onEditSchedule,
  onDeleteSchedule,
}) {
  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Vet schedules</h2>
          <p className="mt-1 text-sm text-gray-500">Manage availability, shifts and time off for your veterinary team.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onManageTimeOff}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Manage time off
          </button>
          <button
            type="button"
            onClick={onAddSchedule}
            className="flex items-center gap-2 rounded-lg bg-[#38c7e5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#27b7d5]"
          >
            <Plus size={16} /> Add schedule
          </button>
        </div>
      </div>

      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <label className="text-sm font-medium text-gray-600">
          Veterinarian
          <select
            value={selectedVet}
            onChange={(event) => setSelectedVet(event.target.value)}
            className="mt-2 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 font-normal text-gray-700"
          >
            <option value="all">All veterinarians</option>
            {schedules.map((schedule) => (
              <option key={schedule.vetId} value={schedule.vetId}>{schedule.name}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-gray-600">
          Week
          <input
            aria-label="Week starting date"
            type="date"
            value={toDateInput(weekStart)}
            onChange={(event) => {
              if (event.target.value) {
                onWeekStartChange(new Date(`${event.target.value}T00:00:00`));
              }
            }}
            className="mt-2 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 font-normal text-gray-700"
          />
          <span className="mt-1 block text-xs text-gray-500">{weekLabel}</span>
        </label>
        <label className="text-sm font-medium text-gray-600">
          Schedule status
          <select
            value={scheduleStatus}
            onChange={(event) => setScheduleStatus(event.target.value)}
            className="mt-2 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 font-normal text-gray-700"
          >
            <option value="all">All statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="timeOff">Time off</option>
          </select>
        </label>
      </div>

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-gray-800">Weekly availability</h3>
          <div className="flex gap-2">
            <button type="button" onClick={() => onWeekStartChange(addDays(weekStart, -7))} className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200">Previous week</button>
            <button type="button" onClick={() => onWeekStartChange(new Date())} className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200">Today</button>
            <button type="button" onClick={() => onWeekStartChange(addDays(weekStart, 7))} className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200">Next week</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] table-fixed text-left">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-medium text-gray-500">
                <th className="w-40 pb-3 pr-3">Veterinarian</th>
                {weekDays.map((date, index) => (
                  <th key={weekdays[index]} className="px-2 pb-3 font-medium">
                    {weekdays[index].slice(0, 3)}, {formatDate(date)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleSchedules.map((schedule) => (
                <tr key={schedule.vetId} className="border-b border-gray-100 last:border-0">
                  <td className="py-3 pr-3 align-top">
                    <p className="text-sm font-semibold text-gray-800">{schedule.name}</p>
                  </td>
                  {schedule.shifts.map((shift, dayIndex) => {
                    const hasTimeOff = shift.timeOff.length > 0;
                    const hasSchedule = Boolean(shift.scheduleId);
                    const showShift = scheduleStatus === "all" ||
                      (scheduleStatus === "timeOff" && hasTimeOff) ||
                      (scheduleStatus === "scheduled" && hasSchedule && !hasTimeOff);

                    return (
                      <td key={`${schedule.vetId}-${dayIndex}`} className="px-2 py-2 align-top">
                        {showShift && (hasSchedule || hasTimeOff) ? (
                          <div className={`min-h-[70px] rounded-lg p-2 ${hasTimeOff ? "bg-amber-50" : "bg-sky-50"}`}>
                            {hasSchedule && (
                              <>
                                <p className="text-xs font-semibold text-sky-800">{shift.start} – {shift.end}</p>
                                {shift.note && <p className="mt-1 text-xs text-gray-500">{shift.note}</p>}
                              </>
                            )}
                            {hasTimeOff && (
                              <ul className="mt-1 space-y-1 break-words text-xs text-amber-900">
                                {shift.timeOff.map((leave) => (
                                  <li key={leave.timeOffId} title={`${leave.reason} · ${leave.hours}`}>
                                    <span className="font-semibold">
                                      {leave.status === "Pending" ? "Pending leave: " : "Leave: "}
                                    </span>
                                    <span className="block text-amber-800">{leave.hours}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                            {hasSchedule ? (
                              <div className="mt-1 flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => onEditSchedule(shift.scheduleId, schedule.vetId, dayIndex)}
                                  className="text-xs font-medium text-[#08a9c5] hover:underline"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeleteSchedule(shift.scheduleId)}
                                  className="text-xs font-medium text-rose-600 hover:underline"
                                >
                                  Delete
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onEditSchedule(null, schedule.vetId, dayIndex)}
                                className="mt-1 text-xs font-medium text-[#08a9c5] hover:underline"
                              >
                                Add schedule
                              </button>
                            )}
                          </div>
                        ) : scheduleStatus === "all" ? (
                          <button
                            type="button"
                            onClick={() => onEditSchedule(null, schedule.vetId, dayIndex)}
                            className="text-sm text-gray-400 hover:text-[#08a9c5]"
                          >
                            Add
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
        <span className="rounded-md bg-sky-50 px-2 py-1 text-sky-700">Scheduled</span>
        <span className="rounded-md bg-amber-50 px-2 py-1 text-amber-700">Time off</span>
        <span>All times are shown in clinic local time (PHT).</span>
      </div>
    </>
  );
}
