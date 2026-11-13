import { useMemo, useState } from "react";
import VetScheduleEditor from "./vet-schedules/VetScheduleEditor.jsx";
import VetScheduleList from "./vet-schedules/VetScheduleList.jsx";
import VetTimeOffManagement from "./vet-schedules/VetTimeOffManagement.jsx";
import {
  addDays,
  createEmptyTimeOffDraft,
  createInitialSchedules,
  createInitialTimeOff,
  createScheduleDraft,
  defaultWeekStart,
  formatDate,
  formatWeekLabel,
  startOfWeek,
  weekdays,
} from "./vet-schedules/vetScheduleData.js";

export default function VetSchedulesTab() {
  const [schedules, setSchedules] = useState(createInitialSchedules);
  const [timeOff, setTimeOff] = useState(createInitialTimeOff);
  const [weekStart, setWeekStart] = useState(defaultWeekStart);
  const [selectedVet, setSelectedVet] = useState("all");
  const [scheduleStatus, setScheduleStatus] = useState("all");
  const [view, setView] = useState("schedules");
  const [editingCell, setEditingCell] = useState(null);
  const [scheduleDraft, setScheduleDraft] = useState(() =>
    createScheduleDraft("sofia", defaultWeekStart, addDays(defaultWeekStart, 4)),
  );
  const [timeOffDraft, setTimeOffDraft] = useState(createEmptyTimeOffDraft);
  const [notice, setNotice] = useState("");

  const weekDays = useMemo(
    () => weekdays.map((_, index) => addDays(weekStart, index)),
    [weekStart],
  );
  const visibleSchedules = schedules.filter(
    (schedule) => selectedVet === "all" || schedule.vetId === selectedVet,
  );
  const weekLabel = formatWeekLabel(weekDays[0], weekDays[4]);

  const handleWeekStartChange = (date) => {
    setWeekStart(startOfWeek(date));
  };

  const openNewSchedule = () => {
    setEditingCell(null);
    setScheduleDraft(createScheduleDraft("sofia", weekDays[0], weekDays[4]));
    setView("editor");
  };

  const openScheduleEditor = (vetId, dayIndex) => {
    const shift = schedules.find((schedule) => schedule.vetId === vetId)?.shifts[dayIndex];
    if (!shift) return;

    setEditingCell({ vetId, dayIndex });
    setScheduleDraft({
      ...createScheduleDraft(vetId, weekDays[dayIndex], weekDays[dayIndex], [dayIndex]),
      startTime: shift.start,
      endTime: shift.end,
      breakStart: shift.breakStart || "",
      breakEnd: shift.breakEnd || "",
      notes: shift.timeOff ? `Time off: ${shift.timeOff}` : "",
    });
    setView("editor");
  };

  const saveSchedule = (event) => {
    event.preventDefault();
    setSchedules((current) =>
      current.map((schedule) => {
        if (schedule.vetId !== scheduleDraft.vetId) return schedule;
        const shifts = [...schedule.shifts];
        scheduleDraft.days.forEach((dayIndex) => {
          shifts[dayIndex] = {
            start: scheduleDraft.startTime,
            end: scheduleDraft.endTime,
            breakStart: scheduleDraft.breakStart,
            breakEnd: scheduleDraft.breakEnd,
          };
        });
        return { ...schedule, shifts };
      }),
    );
    setNotice("Schedule saved for this demo.");
    setView("schedules");
  };

  const openTimeOff = () => {
    setNotice("");
    setView("timeOff");
  };

  const saveTimeOff = (event) => {
    event.preventDefault();
    const veterinarian = schedules.find(
      (schedule) => schedule.vetId === timeOffDraft.veterinarian,
    );
    if (!veterinarian) return;

    setTimeOff((current) => [
      ...current,
      {
        id: Date.now(),
        veterinarian: veterinarian.name,
        date: new Date(`${timeOffDraft.date}T00:00:00`),
        time: timeOffDraft.allDay
          ? "All day"
          : `${timeOffDraft.startTime}–${timeOffDraft.endTime}`,
        reason: timeOffDraft.reason,
        status: "Pending",
      },
    ]);
    setTimeOffDraft(createEmptyTimeOffDraft());
    setNotice("Time off added to the mock schedule.");
  };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      {notice && (
        <p role="status" className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {notice}
        </p>
      )}
      {view === "editor" ? (
        <VetScheduleEditor
          schedules={schedules}
          draft={scheduleDraft}
          setDraft={setScheduleDraft}
          isEditing={Boolean(editingCell)}
          onSubmit={saveSchedule}
          onCancel={() => setView("schedules")}
        />
      ) : view === "timeOff" ? (
        <VetTimeOffManagement
          schedules={schedules}
          timeOff={timeOff}
          draft={timeOffDraft}
          setDraft={setTimeOffDraft}
          onSubmit={saveTimeOff}
          onBack={() => setView("schedules")}
          formatDate={formatDate}
        />
      ) : (
        <VetScheduleList
          schedules={schedules}
          visibleSchedules={visibleSchedules}
          weekDays={weekDays}
          weekStart={weekStart}
          weekLabel={weekLabel}
          selectedVet={selectedVet}
          setSelectedVet={setSelectedVet}
          scheduleStatus={scheduleStatus}
          setScheduleStatus={setScheduleStatus}
          onWeekStartChange={handleWeekStartChange}
          onAddSchedule={openNewSchedule}
          onManageTimeOff={openTimeOff}
          onEditSchedule={openScheduleEditor}
        />
      )}
    </div>
  );
}
