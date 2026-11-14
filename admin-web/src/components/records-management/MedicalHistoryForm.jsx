import { useEffect, useMemo, useState } from "react";

const createInitialForm = (history) => ({
  petId: history?.petId ? String(history.petId) : "",
  visitId: history?.visitId ? String(history.visitId) : "",
  weight: history?.weight ?? "",
  temperature: history?.temperature ?? "",
  heartRate: history?.heartRate ?? "",
  complaint: history?.complaint ?? "",
  assessment: history?.assessment ?? "",
  treatment: history?.treatment ?? "",
  followUp: history?.followUp ?? "",
  attachment: null,
});

const MedicalHistoryForm = ({
  pets,
  visits,
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
    () => visits.filter((visit) => (
      String(visit.petId) === formData.petId
      && (!visit.hasMedicalHistory || String(visit.id) === String(initialHistory?.visitId))
    )),
    [visits, formData.petId, initialHistory?.visitId],
  );
  const selectedVisit = visits.find((visit) => String(visit.id) === formData.visitId);

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleVisitChange = (visitId) => {
    const visit = visits.find((item) => String(item.id) === visitId);
    setFormData((current) => ({
      ...current,
      visitId,
      petId: visit ? String(visit.petId) : current.petId,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(formData);
  };

  const labelClass = "mb-1 block text-xs font-semibold text-slate-600";
  const fieldClass = "w-full rounded-md border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 outline-none focus:border-cyan-400";
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
            <span className={labelClass}>Visit *</span>
            <select
              required
              value={formData.visitId}
              onChange={(event) => handleVisitChange(event.target.value)}
              className={fieldClass}
            >
              <option value="">Select a visit</option>
              {petVisits.map((visit) => (
                <option key={visit.id} value={visit.id}>
                  VIS-{String(visit.id).padStart(4, "0")} · {visit.serviceType} · {visit.date}
                </option>
              ))}
            </select>
            {formData.petId && petVisits.length === 0 && (
              <span className="mt-1 block text-xs text-amber-700">No eligible visits are available. Create a visit or choose one without an existing medical history.</span>
            )}
          </label>
        </div>

        {selectedVisit && (
          <div className="mt-3 grid gap-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600 sm:grid-cols-3">
            <div><span className="block text-xs text-slate-400">Visit type</span>{selectedVisit.visitType}</div>
            <div><span className="block text-xs text-slate-400">Veterinarian</span>{selectedVisit.veterinarian}</div>
            <div><span className="block text-xs text-slate-400">Visit status</span>{selectedVisit.status?.replace(/_/g, " ")}</div>
          </div>
        )}

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
          <label className="sm:col-span-3">
            <span className={labelClass}>Chief complaint & findings *</span>
            <textarea
              required
              value={formData.complaint}
              onChange={(event) => updateField("complaint", event.target.value)}
              placeholder="Enter symptoms and examination findings."
              className={textAreaClass}
            />
          </label>
          <label className="sm:col-span-3">
            <span className={labelClass}>Assessment / Diagnosis *</span>
            <textarea
              required
              value={formData.assessment}
              onChange={(event) => updateField("assessment", event.target.value)}
              placeholder="Enter the diagnosis and clinical assessment."
              className={textAreaClass}
            />
          </label>
          <label className="sm:col-span-3">
            <span className={labelClass}>Treatment & care plan *</span>
            <textarea
              required
              value={formData.treatment}
              onChange={(event) => updateField("treatment", event.target.value)}
              placeholder="Enter treatment, medication and care instructions."
              className={textAreaClass}
            />
          </label>
          <label className="sm:col-span-3">
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
