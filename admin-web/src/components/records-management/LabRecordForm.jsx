import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

const emptyResult = () => ({ parameter: "", result: "", unit: "", referenceRange: "" });
const formatVisitId = (id) => {
  const value = String(id ?? "");
  return /^VIS-/i.test(value) ? value : `VIS-${value.padStart(4, "0")}`;
};

const toDateInput = (value) => {
  if (!value) return "";
  const dateValue = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(dateValue)) return dateValue.slice(0, 10);
  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) return "";
  const localDate = new Date(parsedDate.getTime() - parsedDate.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const createForm = (record) => ({
  petId: record?.petID ? String(record.petID) : "",
  visitId: record?.visitId ? String(record.visitId) : "",
  testType: record?.recordTitle || "",
  collectionDate: toDateInput(record?.uploadedOn || record?.createdAt),
  veterinarian: record?.veterinarian || "",
  status: String(record?.recordStatus || "").toLowerCase() === "draft" ? "Pending" : "Final",
  interpretation: record?.interpretation || "",
  attachment: null,
  results: Array.isArray(record?.results) && record.results.length > 0
    ? record.results.map((result) => ({ ...result }))
    : [emptyResult()]
});

const LabRecordForm = ({
  record,
  pets,
  visits,
  records,
  onCancel,
  onSave
}) => {
  const [formData, setFormData] = useState(() => createForm(record));

  useEffect(() => {
    setFormData(createForm(record));
  }, [record]);

  const selectedPetVisits = useMemo(
    () => visits.filter((visit) => String(visit.petId) === formData.petId),
    [visits, formData.petId]
  );
  const testTypes = [...new Set(records.map((item) => item.recordTitle).filter(Boolean))];
  const veterinarians = [...new Set(visits.map((visit) => visit.veterinarian).filter(Boolean))];

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const updateResult = (index, field, value) => {
    setFormData((current) => ({
      ...current,
      results: current.results.map((result, resultIndex) => (
        resultIndex === index ? { ...result, [field]: value } : result
      ))
    }));
  };

  const handleVisitChange = (visitId) => {
    const visit = visits.find((item) => String(item.id) === visitId);
    setFormData((current) => ({
      ...current,
      visitId,
      petId: visit ? String(visit.petId) : current.petId,
      collectionDate: visit?.date || current.collectionDate,
      veterinarian: visit?.veterinarian || current.veterinarian
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(formData);
  };

  const labelClass = "mb-1 block text-xs font-semibold text-slate-600";
  const inputClass = "w-full rounded-md border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 outline-none focus:border-cyan-400";
  const resultHeaders = ["Parameter", "Result", "Unit", "Reference range"];

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_278px]">
      <form onSubmit={handleSubmit} className="max-h-full overflow-y-auto rounded-2xl bg-white p-4 shadow-sm">
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
                visitId: ""
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
            <span className={labelClass}>Linked visit</span>
            <select value={formData.visitId} onChange={(event) => handleVisitChange(event.target.value)} className={inputClass}>
              <option value="">No visit selected</option>
              {selectedPetVisits.map((visit) => (
                <option key={visit.id} value={visit.id}>
                  {formatVisitId(visit.id)} · {visit.date || "Date unavailable"}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className={labelClass}>Test type *</span>
            <input
              required
              list="lab-test-types"
              value={formData.testType}
              onChange={(event) => updateField("testType", event.target.value)}
              placeholder="Select or enter a test type"
              className={inputClass}
            />
            <datalist id="lab-test-types">
              {testTypes.map((type) => <option key={type} value={type} />)}
            </datalist>
          </label>
          <label>
            <span className={labelClass}>Collection date *</span>
            <input required type="date" value={formData.collectionDate} onChange={(event) => updateField("collectionDate", event.target.value)} className={inputClass} />
          </label>
          <label className="sm:col-span-2">
            <span className={labelClass}>Veterinarian *</span>
            <select required value={formData.veterinarian} onChange={(event) => updateField("veterinarian", event.target.value)} className={inputClass}>
              <option value="">Select veterinarian</option>
              {formData.veterinarian && !veterinarians.includes(formData.veterinarian) && (
                <option value={formData.veterinarian}>{formData.veterinarian}</option>
              )}
              {veterinarians.map((vet) => <option key={vet} value={vet}>{vet}</option>)}
            </select>
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
          {formData.results.map((result, index) => (
            <div key={index} className="col-span-2 grid grid-cols-2 gap-2 lg:col-span-4 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
              {[
                ["parameter", "Parameter"],
                ["result", "Result"],
                ["unit", "Unit"],
                ["referenceRange", "Reference range"]
              ].map(([field, placeholder]) => (
                <input
                  key={field}
                  aria-label={`${placeholder} ${index + 1}`}
                  value={result[field]}
                  onChange={(event) => updateResult(index, field, event.target.value)}
                  placeholder={placeholder}
                  className={inputClass}
                />
              ))}
              {formData.results.length > 1 && (
                <button type="button" aria-label={`Remove result ${index + 1}`} onClick={() => setFormData((current) => ({
                  ...current,
                  results: current.results.filter((_, resultIndex) => resultIndex !== index)
                }))} className="col-span-2 flex justify-end rounded-md px-2 text-slate-400 hover:text-red-600 lg:col-span-1">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
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
          <span className="shrink-0 text-sm text-slate-600">{formData.attachment?.name || record?.originalName || "Choose attachment"}</span>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={(event) => updateField("attachment", event.target.files?.[0] || null)} />
        </label>

        <div className="mt-4 rounded-xl bg-cyan-50 p-3 text-xs leading-relaxed text-cyan-800">
          Mock mode: changes are kept in memory for this session and reset when the page reloads. Files are not uploaded.
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 hover:bg-slate-200">
            Cancel
          </button>
          <button type="submit" className="rounded-lg bg-[#36c5e2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#20b4d2]">
            Save lab record
          </button>
        </div>
      </form>

      <aside className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">Record settings</h3>
        <label className="mt-4 block">
          <span className={labelClass}>Result status *</span>
          <select value={formData.status} onChange={(event) => updateField("status", event.target.value)} className={inputClass}>
            <option value="Final">Final</option>
            <option value="Pending">Pending</option>
          </select>
        </label>
        <div className="mt-4 rounded-xl bg-cyan-50 p-3">
          <h4 className="text-sm font-semibold text-cyan-700">Check before saving</h4>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            Confirm the selected patient, collection date, units and reference ranges.
          </p>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          This laboratory screen uses mock data and does not send records or attachments to the server.
        </p>
      </aside>
    </div>
  );
};

export default LabRecordForm;
