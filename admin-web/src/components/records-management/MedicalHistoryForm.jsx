import { useEffect, useMemo, useState } from "react";

const createInitialForm = (history) => ({
  petId: history?.petId ? String(history.petId) : "",
  visitId: history?.visitId ? String(history.visitId) : "",
  appointmentId: history?.appointmentId ? String(history.appointmentId) : "",
  recordStatus: history?.recordStatus || "Draft",
  weight: history?.weight ?? "",
  temperature: history?.temperature ?? "",
  heartRate: history?.heartRate ?? "",
  complaint: history?.complaint ?? "",
  assessment: history?.assessment ?? "",
  treatment: history?.treatment ?? "",
  followUp: history?.followUp ?? "",
  attachment: null,
});

const isVisitCompleted = (visit) => (
  visit.status === "Completed" || visit.appointmentStatus === "Completed"
);
const formatVisitDate = (date) => {
  if (!date) return "";
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString("en-US");
};

const MedicalHistoryForm = ({
  pets,
  visits,
  appointments = [],
  medicalHistories = [],
  initialHistory,
  onCancel,
  onSave,
  saving,
}) => {
  const [formData, setFormData] = useState(() => createInitialForm(initialHistory));

  useEffect(() => {
    setFormData(createInitialForm(initialHistory));
  }, [initialHistory]);

  const petVisits = useMemo(
    () => {
      const hasHistoryOnDate = (candidate) => medicalHistories.some((history) => (
        String(history.petId) === String(candidate.petId)
        && history.date === candidate.date
      ));

      return [
        ...visits
          .filter((visit) => {
            const isCurrentVisit = String(visit.id) === String(initialHistory?.visitId);
            return String(visit.petId) === formData.petId
              && isVisitCompleted(visit)
              && (!visit.hasMedicalHistory || isCurrentVisit)
              && (!hasHistoryOnDate(visit) || isCurrentVisit);
          })
          .map((visit) => ({
            ...visit,
            source: "visit",
            selectionValue: `visit:${visit.id}`,
          })),
        ...appointments
          .filter((appointment) => {
            const isCurrentAppointment = String(appointment.appointmentId)
              === String(initialHistory?.appointmentId);
            return String(appointment.petId) === formData.petId
              && (!hasHistoryOnDate(appointment) || isCurrentAppointment);
          })
          .map((appointment) => ({
            ...appointment,
            source: "appointment",
            selectionValue: `appointment:${appointment.appointmentId}`,
          })),
      ];
    },
    [
      visits,
      appointments,
      medicalHistories,
      formData.petId,
      initialHistory?.id,
      initialHistory?.visitId,
      initialHistory?.appointmentId,
    ],
  );
  const selectedVisitValue = formData.appointmentId
    ? `appointment:${formData.appointmentId}`
    : formData.visitId
      ? `visit:${formData.visitId}`
      : "";
  const selectedVisit = petVisits.find((visit) => visit.selectionValue === selectedVisitValue);

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(formData);
  };

  const labelClass = "mb-1 block text-xs font-semibold text-slate-600";
  const fieldClass = "w-full rounded-md border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 outline-none focus:border-cyan-400";
  const readOnlyInputClass = `${fieldClass} read-only:bg-slate-50`;
  const textAreaClass = `${fieldClass} min-h-[76px] resize-y`;

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_278px]">
      <form onSubmit={handleSubmit} className="max-h-full overflow-y-auto rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-slate-800">Patient & visit information</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            <span className={labelClass}>Pet *</span>
            <select
              required
              value={formData.petId}
              onChange={(event) => setFormData((current) => ({
                ...current,
                petId: event.target.value,
                visitId: "",
                appointmentId: "",
              }))}
              className={fieldClass}
            >
              <option value="">Select a pet</option>
              {pets.map((pet) => (
                <option key={pet.petID || pet.id} value={pet.petID || pet.id}>
                  {pet.petName || pet.name} · {pet.owner || "Owner not listed"}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className={labelClass}>Linked visit or appointment *</span>
            <select
              required
              value={selectedVisitValue}
              disabled={!formData.petId || petVisits.length === 0}
              onChange={(event) => {
                const selected = petVisits.find((visit) => visit.selectionValue === event.target.value);
                setFormData((current) => ({
                  ...current,
                  visitId: selected?.source === "visit" ? String(selected.id) : "",
                  appointmentId: selected?.source === "appointment" ? String(selected.appointmentId) : "",
                  petId: selected ? String(selected.petId) : current.petId,
                }));
              }}
              className={fieldClass}
            >
              <option value="">
                {!formData.petId
                  ? "Select a pet first"
                  : petVisits.length
                    ? "Select a completed visit or appointment"
                    : "No eligible visits or appointments"}
              </option>
              {petVisits.map((visit) => (
                <option key={visit.selectionValue} value={visit.selectionValue}>
                  {visit.source === "appointment" ? "APT" : "VIS"}-{String(visit.id).padStart(4, "0")} · {visit.serviceType} · {visit.date}
                </option>
              ))}
            </select>
            {formData.petId && petVisits.length === 0 && (
              <span className="mt-1 block text-xs text-amber-700">No completed visit or appointment is available on a date without an existing medical history for this pet.</span>
            )}
          </label>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label>
            <span className={labelClass}>Visit type *</span>
            <input
              required
              readOnly
              value={selectedVisit?.visitType || ""}
              placeholder="Select a linked visit or appointment"
              className={readOnlyInputClass}
            />
          </label>
          <label>
            <span className={labelClass}>Veterinarian *</span>
            <input
              required
              readOnly
              value={selectedVisit?.veterinarian || ""}
              placeholder="Select a linked visit or appointment"
              className={readOnlyInputClass}
            />
          </label>
        </div>

        <h3 className="mb-3 mt-5 text-sm font-semibold text-slate-800">Clinical findings</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["weight", "Weight (kg)", "999.99", "0.01"],
            ["temperature", "Temperature (°C)", "99.9", "0.1"],
            ["heartRate", "Heart rate (bpm)", "300", "1"],
          ].map(([field, label, max, step]) => (
            <label key={field}>
              <span className={labelClass}>{label}</span>
              <input
                type="number"
                min="0"
                max={max}
                step={step}
                value={formData[field]}
                onChange={(event) => updateField(field, event.target.value)}
                className={fieldClass}
              />
            </label>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label>
            <span className={labelClass}>Chief complaint & findings *</span>
            <textarea
              required
              value={formData.complaint}
              onChange={(event) => updateField("complaint", event.target.value)}
              placeholder="Enter symptoms and examination findings."
              className={textAreaClass}
            />
          </label>
          <label>
            <span className={labelClass}>Assessment / Diagnosis *</span>
            <textarea
              required
              value={formData.assessment}
              onChange={(event) => updateField("assessment", event.target.value)}
              placeholder="Enter the diagnosis and clinical assessment."
              className={textAreaClass}
            />
          </label>
          <label>
            <span className={labelClass}>Treatment & care plan *</span>
            <textarea
              required
              value={formData.treatment}
              onChange={(event) => updateField("treatment", event.target.value)}
              placeholder="Enter treatment, medication and care instructions."
              className={textAreaClass}
            />
          </label>
          <label>
            <span className={labelClass}>Follow-up instructions</span>
            <textarea
              value={formData.followUp}
              onChange={(event) => updateField("followUp", event.target.value)}
              placeholder="Enter return date and monitoring instructions."
              className={textAreaClass}
            />
          </label>
        </div>

        <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
          <span>
            <span className="block text-sm font-medium text-slate-700">Clinical attachment</span>
            <span className="block text-xs text-slate-500">PDF, JPG or PNG · Up to 10 MB</span>
          </span>
          <span className="shrink-0 text-sm text-slate-600">
            {formData.attachment?.name || initialHistory?.attachments?.[0]?.originalName || "Choose file"}
          </span>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="sr-only"
            onChange={(event) => updateField("attachment", event.target.files?.[0] || null)}
          />
        </label>

        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onCancel} disabled={saving} className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 hover:bg-slate-200 disabled:opacity-60">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="rounded-lg bg-[#36c5e2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#20b4d2] disabled:opacity-60">
            {saving ? "Saving..." : "Save medical record"}
          </button>
        </div>
      </form>

      <aside className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">Record settings</h3>
        <label className="mt-4 block">
          <span className={labelClass}>Visit date *</span>
          <input
            required
            readOnly
            value={formatVisitDate(selectedVisit?.date)}
            placeholder="Select a linked visit or appointment"
            className={readOnlyInputClass}
          />
        </label>
        <label className="mt-4 block">
          <span className={labelClass}>Record status *</span>
          <select
            required
            value={formData.recordStatus}
            onChange={(event) => updateField("recordStatus", event.target.value)}
            className={fieldClass}
          >
            <option value="Draft">Draft</option>
            <option value="Completed">Completed</option>
          </select>
          <span className="mt-1 block text-xs text-slate-500">Frontend only; this status is not saved to the database.</span>
        </label>
        <div className="mt-4 rounded-xl bg-cyan-50 p-3">
          <h4 className="text-sm font-semibold text-cyan-700">Clinical record checklist</h4>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            Findings, assessment, treatment and follow-up are saved to the selected visit.
          </p>
        </div>
      </aside>
    </div>
  );
};

export default MedicalHistoryForm;
