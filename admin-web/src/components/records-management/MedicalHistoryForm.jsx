import { useEffect, useMemo, useState } from "react";

const createInitialForm = (visit) => ({
  petId: visit?.petId ? String(visit.petId) : "",
  visitId: visit?.id ? String(visit.id) : "",
  serviceType: visit?.serviceType || "",
  date: visit?.date || "",
  veterinarian: visit?.veterinarian || "",
  status: visit?.status || "Completed",
  weight: "",
  temperature: "",
  heartRate: "",
  complaint: "",
  assessment: "",
  treatment: "",
  followUp: "",
  linkedRecordId: "",
  attachment: null
});

const MedicalHistoryForm = ({ pets, visits, records, initialVisit, onCancel }) => {
  const [formData, setFormData] = useState(() => createInitialForm(initialVisit));
  const [showUnsavedNotice, setShowUnsavedNotice] = useState(false);

  useEffect(() => {
    setFormData(createInitialForm(initialVisit));
    setShowUnsavedNotice(false);
  }, [initialVisit]);

  const petVisits = useMemo(
    () => visits.filter((visit) => String(visit.petId) === formData.petId),
    [visits, formData.petId]
  );
  const petRecords = useMemo(
    () => records.filter((record) => String(record.petID) === formData.petId),
    [records, formData.petId]
  );
  const serviceTypes = [...new Set(visits.map((visit) => visit.serviceType).filter(Boolean))];
  const veterinarians = [...new Set(visits.map((visit) => visit.veterinarian).filter(Boolean))];

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setShowUnsavedNotice(false);
  };

  const handleVisitChange = (visitId) => {
    const visit = visits.find((item) => String(item.id) === visitId);
    if (!visit) {
      updateField("visitId", "");
      return;
    }

    setFormData((current) => ({
      ...current,
      visitId,
      petId: String(visit.petId),
      serviceType: visit.serviceType || "",
      date: visit.date || "",
      veterinarian: visit.veterinarian || "",
      status: visit.status || "Completed"
    }));
    setShowUnsavedNotice(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setShowUnsavedNotice(true);
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
                serviceType: "",
                date: "",
                veterinarian: ""
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
                  VIS-{String(visit.id).padStart(4, "0")} · {visit.serviceType || "Visit"} · {visit.date || "Date unavailable"}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className={labelClass}>Visit type *</span>
            <select
              required
              value={formData.serviceType}
              onChange={(event) => updateField("serviceType", event.target.value)}
              className={fieldClass}
            >
              <option value="">Select visit type</option>
              {serviceTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <label>
            <span className={labelClass}>Visit date *</span>
            <input
              required
              type="date"
              value={formData.date}
              onChange={(event) => updateField("date", event.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="sm:col-span-2">
            <span className={labelClass}>Veterinarian *</span>
            <select
              required
              value={formData.veterinarian}
              onChange={(event) => updateField("veterinarian", event.target.value)}
              className={fieldClass}
            >
              <option value="">Select veterinarian</option>
              {veterinarians.map((vet) => <option key={vet} value={vet}>{vet}</option>)}
            </select>
          </label>
        </div>

        <h3 className="mb-3 mt-5 text-sm font-semibold text-slate-800">Clinical findings</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["weight", "Weight (kg)", "number"],
            ["temperature", "Temperature (°C)", "number"],
            ["heartRate", "Heart rate (bpm)", "number"]
          ].map(([field, label, type]) => (
            <label key={field}>
              <span className={labelClass}>{label}</span>
              <input
                type={type}
                min="0"
                step="any"
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
          <label className="sm:col-span-3">
            <span className={labelClass}>Linked lab record</span>
            <select
              value={formData.linkedRecordId}
              onChange={(event) => updateField("linkedRecordId", event.target.value)}
              className={fieldClass}
            >
              <option value="">No lab record selected</option>
              {petRecords.map((record) => (
                <option key={record.id} value={record.id}>
                  LAB-{String(record.id).padStart(4, "0")} · {record.recordTitle || record.type || "Lab record"}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
          <span>
            <span className="block text-sm font-medium text-slate-700">Clinical attachments</span>
            <span className="block text-xs text-slate-500">Prescriptions, images or supporting notes</span>
          </span>
          <span className="shrink-0 text-sm text-slate-600">
            {formData.attachment?.name || "Choose attachment"}
          </span>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="sr-only"
            onChange={(event) => updateField("attachment", event.target.files?.[0] || null)}
          />
        </label>

        <div className="mt-4 rounded-xl bg-cyan-50 p-3 text-xs leading-relaxed text-cyan-800">
          This is a UI preview. Medical-history details and attachments are not saved by the current system.
        </div>
        {showUnsavedNotice && (
          <p role="status" className="mt-3 text-sm text-amber-700">
            This form is not connected to a save service yet; no changes were saved.
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 hover:bg-slate-200">
            Cancel
          </button>
          <button type="submit" className="rounded-lg bg-[#36c5e2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#20b4d2]">
            Save medical record
          </button>
        </div>
      </form>

      <aside className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">Record settings</h3>
        <label className="mt-4 block">
          <span className={labelClass}>Visit status *</span>
          <select
            value={formData.status}
            onChange={(event) => updateField("status", event.target.value)}
            className={fieldClass}
          >
            {["Completed", "Checked_in", "Pending", "Cancelled"].map((status) => (
              <option key={status} value={status}>{status.replace("_", " ")}</option>
            ))}
          </select>
        </label>
        <div className="mt-4 rounded-xl bg-cyan-50 p-3">
          <h4 className="text-sm font-semibold text-cyan-700">Clinical record checklist</h4>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            Record findings, diagnosis and treatment clearly. Include follow-up instructions for continuity of care.
          </p>
        </div>
      </aside>
    </div>
  );
};

export default MedicalHistoryForm;
