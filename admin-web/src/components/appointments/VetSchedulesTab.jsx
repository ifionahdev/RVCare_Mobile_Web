import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../api/authAxios.js";
import { Toast } from "../AlertModal.jsx";
import VetScheduleEditor from "./vet-schedules/VetScheduleEditor.jsx";
import VetScheduleList from "./vet-schedules/VetScheduleList.jsx";
import VetTimeOffManagement from "./vet-schedules/VetTimeOffManagement.jsx";
import {
  addDays,
  createEmptyTimeOffDraft,
  createScheduleDraft,
  defaultWeekStart,
  formatDate,
  formatWeekLabel,
  groupSchedulesByVeterinarian,
  startOfWeek,
  todayInManilaDate,
  weekdays,
} from "./vet-schedules/vetScheduleData.js";

const errorMessage = (error) =>
  error.response?.data?.message ?? error.message ?? "The request failed. Please try again.";

export default function VetSchedulesTab() {
  const [veterinarians, setVeterinarians] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [timeOff, setTimeOff] = useState([]);
  const [timeOptions, setTimeOptions] = useState({ startTimes: [], endTimes: [] });
  const [weekStart, setWeekStart] = useState(defaultWeekStart);
  const [selectedVet, setSelectedVet] = useState("all");
  const [scheduleStatus, setScheduleStatus] = useState("all");
  const [view, setView] = useState("schedules");
  const [scheduleDraft, setScheduleDraft] = useState(() => createScheduleDraft());
  const [timeOffDraft, setTimeOffDraft] = useState(createEmptyTimeOffDraft);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const refreshData = useCallback(async () => {
    const [vetsResponse, schedulesResponse, timeOffResponse, timeOptionsResponse] = await Promise.all([
      api.get("/vets"),
      api.get("/admin/vet-schedules"),
      api.get("/admin/vet-schedules/time-off"),
      api.get("/admin/vet-schedules/time-options"),
    ]);
    setVeterinarians(vetsResponse.data ?? []);
    setSchedules(schedulesResponse.data ?? []);
    setTimeOff(timeOffResponse.data ?? []);
    setTimeOptions(timeOptionsResponse.data ?? { startTimes: [], endTimes: [] });
  }, []);

  useEffect(() => {
    let active = true;
    refreshData()
      .catch((requestError) => {
        if (active) setToast({ type: "error", message: errorMessage(requestError) });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshData]);

  const weekDays = useMemo(
    () => weekdays.map((_, index) => addDays(weekStart, index)),
    [weekStart],
  );
  const weekLabel = formatWeekLabel(weekDays[0], weekDays[weekDays.length - 1]);
  const groupedSchedules = useMemo(
    () => groupSchedulesByVeterinarian(veterinarians, schedules, timeOff, weekDays),
    [veterinarians, schedules, timeOff, weekDays],
  );
  const visibleSchedules = groupedSchedules.filter(
    (schedule) => selectedVet === "all" || schedule.vetId === selectedVet,
  );

  const handleWeekStartChange = (date) => setWeekStart(startOfWeek(date));

  const openNewSchedule = () => {
    setScheduleDraft(createScheduleDraft(veterinarians[0]?.vetId ?? ""));
    setToast(null);
    setView("editor");
  };

  const openScheduleEditor = (scheduleId, vetId, dayIndex) => {
    const schedule = schedules.find((item) => item.scheduleId === scheduleId);
    if (schedule) {
      setScheduleDraft({
        scheduleId: schedule.scheduleId,
        vetId: String(schedule.vetId),
        days: [schedule.dayOfWeek],
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        note: schedule.note ?? "",
      });
    } else {
      setScheduleDraft(createScheduleDraft(vetId, [dayIndex + 1]));
    }
    setToast(null);
    setView("editor");
  };

  const saveSchedule = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setToast(null);

    const data = {
      vetId: Number(scheduleDraft.vetId),
      startTime: scheduleDraft.startTime,
      endTime: scheduleDraft.endTime,
      note: scheduleDraft.note,
    };

    try {
      if (scheduleDraft.scheduleId) {
        await api.put(`/admin/vet-schedules/${scheduleDraft.scheduleId}`, {
          ...data,
          dayOfWeek: scheduleDraft.days[0],
        });
      } else {
        await api.post("/admin/vet-schedules", {
          ...data,
          days: scheduleDraft.days,
        });
      }
      await refreshData();
      setToast({
        type: "success",
        message: scheduleDraft.scheduleId ? "Schedule updated." : "Schedule added.",
      });
      setView("schedules");
    } catch (requestError) {
      setToast({ type: "error", message: errorMessage(requestError) });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSchedule = async (scheduleId) => {
    if (!window.confirm("Delete this weekly schedule?")) return;
    setIsSaving(true);
    setToast(null);
    try {
      await api.delete(`/admin/vet-schedules/${scheduleId}`);
      await refreshData();
      setToast({ type: "success", message: "Schedule deleted." });
    } catch (requestError) {
      setToast({ type: "error", message: errorMessage(requestError) });
    } finally {
      setIsSaving(false);
    }
  };

  const openTimeOff = () => {
    setTimeOffDraft(createEmptyTimeOffDraft());
    setToast(null);
    setView("timeOff");
  };

  const editTimeOff = (item) => {
    setTimeOffDraft({
      timeOffId: item.timeOffId,
      vetId: String(item.vetId),
      date: item.date,
      allDay: !item.startTime,
      startTime: item.startTime ?? "",
      endTime: item.endTime ?? "",
      reason: item.reason,
      notes: item.note ?? "",
      status: item.status,
    });
    setToast(null);
  };

  const saveTimeOff = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setToast(null);
    const data = {
      vetId: Number(timeOffDraft.vetId),
      date: timeOffDraft.date,
      startTime: timeOffDraft.allDay ? null : timeOffDraft.startTime,
      endTime: timeOffDraft.allDay ? null : timeOffDraft.endTime,
      reason: timeOffDraft.reason,
      note: timeOffDraft.notes,
      status: timeOffDraft.status,
    };

    try {
      if (timeOffDraft.timeOffId) {
        await api.put(`/admin/vet-schedules/time-off/${timeOffDraft.timeOffId}`, data);
      } else {
        await api.post("/admin/vet-schedules/time-off", data);
      }
      await refreshData();
      setToast({
        type: "success",
        message: timeOffDraft.timeOffId ? "Time off updated." : "Time off added.",
      });
      setTimeOffDraft(createEmptyTimeOffDraft());
    } catch (requestError) {
      setToast({ type: "error", message: errorMessage(requestError) });
    } finally {
      setIsSaving(false);
    }
  };

  const changeTimeOffStatus = async (item, status) => {
    setIsSaving(true);
    setToast(null);
    try {
      await api.put(`/admin/vet-schedules/time-off/${item.timeOffId}`, {
        vetId: item.vetId,
        date: item.date,
        startTime: item.startTime,
        endTime: item.endTime,
        reason: item.reason,
        note: item.note ?? "",
        status,
      });
      await refreshData();
      setToast({ type: "success", message: `Time off ${status.toLowerCase()}.` });
    } catch (requestError) {
      setToast({ type: "error", message: errorMessage(requestError) });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTimeOff = async (timeOffId) => {
    if (!window.confirm("Delete this time-off entry?")) return;
    setIsSaving(true);
    setToast(null);
    try {
      await api.delete(`/admin/vet-schedules/time-off/${timeOffId}`);
      await refreshData();
      setToast({ type: "success", message: "Time off deleted." });
      if (timeOffDraft.timeOffId === timeOffId) {
        setTimeOffDraft(createEmptyTimeOffDraft());
      }
    } catch (requestError) {
      setToast({ type: "error", message: errorMessage(requestError) });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      {loading ? (
        <p className="rounded-lg bg-white px-4 py-8 text-center text-sm text-gray-500">
          Loading veterinarian schedules...
        </p>
      ) : view === "editor" ? (
        <VetScheduleEditor
          veterinarians={veterinarians}
          timeOptions={timeOptions}
          draft={scheduleDraft}
          setDraft={setScheduleDraft}
          isEditing={Boolean(scheduleDraft.scheduleId)}
          isSaving={isSaving}
          onSubmit={saveSchedule}
          onCancel={() => setView("schedules")}
        />
      ) : view === "timeOff" ? (
        <VetTimeOffManagement
          veterinarians={veterinarians}
          timeOptions={timeOptions}
          timeOff={timeOff}
          draft={timeOffDraft}
          setDraft={setTimeOffDraft}
          isSaving={isSaving}
          onSubmit={saveTimeOff}
          onBack={() => setView("schedules")}
          onEdit={editTimeOff}
          onDelete={deleteTimeOff}
          onStatusChange={changeTimeOffStatus}
          formatDate={formatDate}
          minDate={todayInManilaDate()}
        />
      ) : (
        <VetScheduleList
          schedules={groupedSchedules}
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
          onDeleteSchedule={deleteSchedule}
        />
      )}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
