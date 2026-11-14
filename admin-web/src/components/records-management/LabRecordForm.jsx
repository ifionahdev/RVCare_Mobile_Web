import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

const emptyResult = () => ({ parameter: "", result: "", unit: "", referenceRange: "" });
const formatVisitId = (id) => `VIS-${String(id ?? "").padStart(4, "0")}`;
const isVisitCompleted = (visit) => (
  visit.status === "Completed" || visit.appointmentStatus === "Completed"
);
const formatVisitDate = (date) => {
  if (!date) return "";
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString("en-US");
};

const createForm = (record) => ({
  petId: record?.petID ? String(record.petID) : "",
  visitId: record?.visitId ? String(record.visitId) : "",
  appointmentId: record?.appointmentId ? String(record.appointmentId) : "",
  testType: record?.recordTitle || "",
  interpretation: record?.interpretation || "",
  attachment: null,
  results: Array.isArray(record?.results) && record.results.length > 0
    ? record.results.map((result) => ({ ...result }))
    : [emptyResult()],
});

const LabRecordForm = ({
  record,
  pets,
  visits,
  appointments = [],
  testTypes,
  onCancel,
  onSave,
  saving,
}) => {
  const [formData, setFormData] = useState(() => createForm(record));

  useEffect(() => {
    setFormData(createForm(record));
  }, [record]);

  const selectedPetVisits = useMemo(
    () => [
      ...visits
        .filter((visit) => String(visit.petId) === formData.petId && isVisitCompleted(visit))
        .map((visit) => ({
          ...visit,
          source: "visit",
          selectionValue: `visit:${visit.id}`,
        })),
      ...appointments
        .filter((appointment) => String(appointment.petId) === formData.petId)
        .map((appointment) => ({
          ...appointment,
          source: "appointment",
          selectionValue: `appointment:${appointment.appointmentId}`,
        })),
    ],
    [visits, appointments, formData.petId],
  );
  const selectedVisitValue = formData.appointmentId
    ? `appointment:${formData.appointmentId}`
    : formData.visitId
      ? `visit:${formData.visitId}`
      : "";
  const selectedVisit = selectedPetVisits.find((visit) => visit.selectionValue === selectedVisitValue);

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const updateResult = (index, field, value) => {
    setFormData((current) => ({
      ...current,
      results: current.results.map((result, resultIndex) => (
        resultIndex === index ? { ...result, [field]: value } : result
      )),
    }));
  };

  const handleTestTypeChange = (value) => {
    setFormData((current) => ({
      ...current,
      testType: value,
      results: testTypes.find((item) => item.name === value)?.parameters?.length
        ? testTypes.find((item) => item.name === value).parameters.map((parameter) => ({
            parameter: parameter.name,
            result: "",
            unit: parameter.unit,
            referenceRange: parameter.referenceRange,
          }))
        : current.results,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({
      ...formData,
      results: formData.results.filter((result) => (
        result.parameter.trim()
        || result.result.trim()
        || result.unit.trim()
        || result.referenceRange.trim()
      )),
    });
  };

  const labelClass = "mb-1 block text-xs font-semibold text-slate-600";
  const inputClass = "w-full rounded-md border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 outline-none focus:border-cyan-400";
  const readOnlyInputClass = `${inputClass} read-only:bg-slate-50`;
  const resultHeaders = ["Parameter", "Result", "Unit", "Reference range"];

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_278px]">
      <div className="min-w-0">
        <form id="lab-record-form" onSubmit={handleSubmit} className="max-h-full overflow-y-auto rounded-2xl bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-800">Patient & test information</h3>
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
                className={inputClass}
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
                disabled={!formData.petId || selectedPetVisits.length === 0}
                onChange={(event) => {
                  const selected = selectedPetVisits.find((item) => item.selectionValue === event.target.value);
                  setFormData((current) => ({
                    ...current,
                    visitId: selected?.source === "visit" ? String(selected.id) : "",
                    appointmentId: selected?.source === "appointment" ? String(selected.appointmentId) : "",
                    petId: selected ? String(selected.petId) : current.petId,
                  }));
                }}
                className={inputClass}
              >
                <option value="">
                  {!formData.petId
                    ? "Select a pet first"
                    : selectedPetVisits.length
                      ? "Select a completed visit or appointment"
                      : "No completed visits or appointments available"}
                </option>
                {selectedPetVisits.map((visit) => (
                  <option key={visit.selectionValue} value={visit.selectionValue}>
                    {visit.source === "appointment"
                      ? `APT-${String(visit.id).padStart(4, "0")}`
                      : formatVisitId(visit.id)} · {visit.date}
                  </option>
                ))}
              </select>
              {formData.petId && selectedPetVisits.length === 0 && (
                <span className="mt-1 block text-xs text-amber-700">This pet has no completed visits or appointments available.</span>
              )}
            </label>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label>
              <span className={labelClass}>Test type *</span>
              <input
                required
                list="lab-test-types"
                value={formData.testType}
                onChange={(event) => handleTestTypeChange(event.target.value)}
                placeholder="Select or enter a test type"
                className={inputClass}
              />
              <datalist id="lab-test-types">
                {testTypes.map((type) => <option key={type.id} value={type.name} />)}
              </datalist>
            </label>
            <label>
              <span className={labelClass}>Collection date *</span>
              <input
                required
                readOnly
                value={formatVisitDate(selectedVisit?.date)}
                placeholder="Select a linked visit"
                className={readOnlyInputClass}
              />
            </label>
            <label>
              <span className={labelClass}>Veterinarian *</span>
              <input
                required
                readOnly
                value={selectedVisit?.veterinarian || ""}
                placeholder="Select a linked visit"
                className={readOnlyInputClass}
              />
            </label>
          </div>

          <div className="mb-2 mt-5 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-800">Lab results</h3>
            <button
              type="button"
              onClick={() => setFormData((current) => ({ ...current, results: [...current.results, emptyResult()] }))}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
            >
              <Plus size={14} /> Add result
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {resultHeaders.map((heading) => (
              <div key={heading} className="rounded-md bg-slate-100 px-2 py-2 text-xs font-semibold text-slate-600">
                {heading}
              </div>
            ))}
            {formData.results.map((result, index) => {
              const hasResultData = Object.values(result).some((value) => value.trim());
              return (
                <div key={index} className="col-span-2 grid grid-cols-2 gap-2 lg:col-span-4 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
                  {[
                    ["parameter", "Parameter"],
                    ["result", "Result"],
                    ["unit", "Unit"],
                    ["referenceRange", "Reference range"],
                  ].map(([field, placeholder]) => (
                    <input
                      key={field}
                      required={
                        hasResultData && (field === "parameter" || field === "result")
                      }
                      aria-label={`${placeholder} ${index + 1}`}
                      value={result[field]}
                      onChange={(event) => updateResult(index, field, event.target.value)}
                      placeholder={placeholder}
                      className={inputClass}
                    />
                  ))}
                  {formData.results.length > 1 && (
                    <button
                      type="button"
                      aria-label={`Remove result ${index + 1}`}
                      onClick={() => setFormData((current) => ({
                        ...current,
                        results: current.results.filter((_item, resultIndex) => resultIndex !== index),
                      }))}
                      className="col-span-2 flex justify-end rounded-md px-2 text-slate-400 hover:text-red-600 lg:col-span-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <label className="mt-4 block">
            <span className={labelClass}>Clinical interpretation</span>
            <textarea
              value={formData.interpretation}
              onChange={(event) => updateField("interpretation", event.target.value)}
              placeholder="Enter the interpretation of the lab findings."
              className={`${inputClass} min-h-[72px] resize-y`}
            />
          </label>

          <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
            <span>
              <span className="block text-sm font-medium text-slate-700">Attach lab report</span>
              <span className="block text-xs text-slate-500">PDF, JPG or PNG · Up to 10 MB per attachment</span>
            </span>
            <span className="shrink-0 text-sm text-slate-600">
              {formData.attachment?.name || record?.attachments?.[0]?.originalName || "Choose attachment"}
            </span>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="sr-only"
              onChange={(event) => updateField("attachment", event.target.files?.[0] || null)}
            />
          </label>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={onCancel} disabled={saving} className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 hover:bg-slate-200 disabled:opacity-60">
            Cancel
          </button>
          <button type="submit" form="lab-record-form" disabled={saving} className="rounded-lg bg-[#36c5e2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#20b4d2] disabled:opacity-60">
            {saving ? "Saving..." : "Save lab record"}
          </button>
        </div>
      </div>

      <aside className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">Automatic status</h3>
        <div className="mt-4 rounded-xl bg-cyan-50 p-3">
          <h4 className="text-sm font-semibold text-cyan-700">Check before saving</h4>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            Confirm the selected patient, collection date, result values, units and reference ranges.
          </p>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          Status is determined automatically: records with result values are uploaded, and records without them remain pending.
        </p>
      </aside>
    </div>
  );
};

export default LabRecordForm;
