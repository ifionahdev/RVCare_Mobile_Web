import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import LabRecordForm from "./LabRecordForm";
import { mockLabVisits } from "./mockLabRecords";

const PAGE_SIZE = 6;

const isRecordUploaded = (record) => {
  if (typeof record?.isUploaded === "boolean") return record.isUploaded;
  if (typeof record?.isUploaded === "number") return record.isUploaded === 1;
  if (typeof record?.isUploaded === "string") {
    const status = record.isUploaded.trim().toLowerCase();
    if (["1", "true", "uploaded"].includes(status)) return true;
    if (["0", "false", "draft"].includes(status)) return false;
  }
  if (typeof record?.recordStatus === "string") {
    return record.recordStatus.trim().toLowerCase() === "uploaded";
  }
  return Boolean(record?.fileName || record?.storedName || record?.filePath || record?.originalName || record?.uploadedOn);
};

const formatDate = (value) => {
  if (!value) return "Date not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not available";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatRecordId = (id) => {
  const value = String(id ?? "");
  return /^LAB-/i.test(value) ? value : `LAB-${value.padStart(4, "0")}`;
};

const LaboratoryRecordsWorkspace = ({
  records,
  allRecords,
  pets,
  selectedRecord,
  setSelectedRecord,
  canManageRecords,
  onSaveRecord,
  onDeleteRecord,
  searchQuery,
  setSearchQuery,
  statusFilter,
  onStatusFilterChange
}) => {
  const [testFilter, setTestFilter] = useState("");
  const [page, setPage] = useState(0);
  const [screen, setScreen] = useState("list");
  const [editingRecord, setEditingRecord] = useState(null);
  const visits = mockLabVisits;

  const tests = useMemo(
    () => [...new Set(allRecords.map((record) => record.recordTitle || record.type).filter(Boolean))].sort(),
    [allRecords]
  );
  const visibleRecords = records.filter((record) => (
    !testFilter || (record.recordTitle || record.type) === testFilter
  ));
  const pageCount = Math.max(1, Math.ceil(visibleRecords.length / PAGE_SIZE));
  const pageRecords = visibleRecords.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, testFilter, statusFilter]);

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, pageCount - 1));
  }, [pageCount]);

  const activeRecord = selectedRecord;
  const selectedPet = pets.find((pet) => String(pet.petID || pet.id) === String(activeRecord?.petID))
    || (activeRecord ? {
      id: activeRecord.petID,
      petID: activeRecord.petID,
      petName: activeRecord.petName,
      owner: activeRecord.owner
    } : null)
    || pets[0]
    || null;
  const petRecords = selectedPet
    ? allRecords.filter((record) => String(record.petID) === String(selectedPet.petID || selectedPet.id))
    : [];
  const latestRecord = petRecords.reduce((latest, record) => {
    const date = new Date(record.uploadedOn || record.createdAt || 0);
    return !latest || date > latest.date ? { record, date } : latest;
  }, null)?.record;

  const backToList = () => {
    setScreen("list");
    setEditingRecord(null);
    setSelectedRecord(null);
  };

  const openForm = (record = null) => {
    setEditingRecord(record);
    setScreen("form");
  };

  const handleSave = (formData) => {
    const pet = pets.find((item) => String(item.petID || item.id) === formData.petId);
    const visit = visits.find((item) => String(item.id) === formData.visitId);
    const nextNumber = allRecords.reduce((max, item) => {
      const match = String(item.id).match(/(\d+)$/);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0) + 1;
    const updatedRecord = {
      ...editingRecord,
      id: editingRecord?.id || `LAB-${String(nextNumber).padStart(4, "0")}`,
      petID: formData.petId,
      petName: pet?.petName || pet?.name || "Patient",
      owner: pet?.owner || "",
      type: "lab",
      recordTitle: formData.testType,
      uploadedOn: formData.collectionDate,
      recordStatus: formData.status.toLowerCase(),
      isUploaded: formData.status === "Final",
      veterinarian: formData.veterinarian,
      visitId: formData.visitId,
      visitDate: visit?.date || "",
      originalName: formData.attachment?.name || editingRecord?.originalName || "",
      fileSize: formData.attachment ? "Local mock attachment" : editingRecord?.fileSize || "",
      interpretation: formData.interpretation,
      results: formData.results
    };

    onSaveRecord(updatedRecord);
    setSelectedRecord(updatedRecord);
    setEditingRecord(null);
    setScreen("details");
  };

  const handleDelete = (record) => {
    if (window.confirm(`Remove ${formatRecordId(record.id)} from the mock lab records?`)) {
      onDeleteRecord(record);
    }
  };

  if (screen === "form") {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Add or edit lab record</h2>
            <p className="mt-1 text-sm text-slate-500">Lab Records / Record entry</p>
          </div>
          <button type="button" onClick={backToList} className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 hover:bg-slate-200">
            Back to lab records
          </button>
        </div>
        <LabRecordForm
          record={editingRecord}
          pets={pets}
          visits={visits}
          records={allRecords}
          onCancel={backToList}
          onSave={handleSave}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">
              {screen === "details" && activeRecord ? "Lab record details" : "Lab records"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
              {screen === "details" && activeRecord
              ? `Lab Records / ${formatRecordId(activeRecord.id)}`
                : "Mock lab results. Changes reset when you reload this page."}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {screen === "details" && activeRecord && (
            <button
              type="button"
              onClick={backToList}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-200"
            >
              <ArrowLeft size={16} />
              Back to lab records
            </button>
          )}
          {screen === "list" && canManageRecords && (
            <button
              type="button"
              onClick={() => openForm()}
              className="inline-flex items-center gap-2 rounded-lg bg-[#36c5e2] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#20b4d2]"
            >
              <Plus size={16} />
              Add lab record
            </button>
          )}
          {screen === "details" && activeRecord && canManageRecords && (
            <button
              type="button"
              onClick={() => openForm(activeRecord)}
              className="rounded-lg bg-[#36c5e2] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#20b4d2]"
            >
              Edit record
            </button>
          )}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_278px]">
        <section className="min-h-0 rounded-2xl bg-white p-4 shadow-sm">
          {screen === "details" && activeRecord ? (
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    {activeRecord.recordTitle || activeRecord.type || "Laboratory report"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatRecordId(activeRecord.id)} <span className="px-1">·</span>
                    {formatDate(activeRecord.uploadedOn || activeRecord.createdAt)}
                  </p>
                </div>
                <span className={`rounded-md px-2 py-1 text-xs font-medium ${
                  isRecordUploaded(activeRecord) ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                }`}>
                  {isRecordUploaded(activeRecord) ? "Final" : "Pending"}
                </span>
              </div>

              <div className="mt-6 grid gap-3 border-y border-slate-100 py-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-slate-400">Patient</p>
                  <p className="mt-1 text-sm text-slate-700">{activeRecord.petName || "Patient not listed"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">Owner</p>
                  <p className="mt-1 text-sm text-slate-700">{activeRecord.owner || "Owner not listed"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">Record type</p>
                  <p className="mt-1 text-sm text-slate-700">{activeRecord.type || "Laboratory"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">Date</p>
                  <p className="mt-1 text-sm text-slate-700">
                    {formatDate(activeRecord.uploadedOn || activeRecord.createdAt)}
                  </p>
                </div>
              </div>

              <h4 className="mt-5 text-sm font-semibold text-slate-800">Lab results</h4>
              {Array.isArray(activeRecord.results) && activeRecord.results.length > 0 ? (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[480px] border-collapse text-left">
                    <thead className="bg-slate-50">
                      <tr>
                        {["Parameter", "Result", "Reference range", "Unit"].map((heading) => (
                          <th key={heading} className="px-3 py-2 text-xs font-semibold text-slate-500">{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activeRecord.results.map((result, index) => (
                        <tr key={`${result.parameter}-${index}`} className="border-b border-slate-100 last:border-0">
                          <td className="px-3 py-2 text-sm text-slate-700">{result.parameter || "—"}</td>
                          <td className="px-3 py-2 text-sm text-slate-600">{result.result || "—"}</td>
                          <td className="px-3 py-2 text-sm text-slate-600">{result.referenceRange || "—"}</td>
                          <td className="px-3 py-2 text-sm text-slate-600">{result.unit || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-500">No result values are available in this mock record.</p>
              )}
              {activeRecord.interpretation && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-slate-800">Clinical interpretation</h4>
                  <p className="mt-1 text-sm text-slate-600">{activeRecord.interpretation}</p>
                </div>
              )}
              <h4 className="mt-5 text-sm font-semibold text-slate-800">Lab report</h4>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-700">
                    {activeRecord.originalName || "No mock attachment"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {activeRecord.fileSize || "Attachment preview is not available in mock mode"}
                  </p>
                </div>
                <span className="text-xs font-medium text-cyan-700">Mock data</span>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <input
                  type="search"
                  aria-label="Search patients or lab records"
                  placeholder="Search pet, owner or record ID"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="min-w-[220px] flex-1 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none ring-1 ring-transparent placeholder:text-slate-400 focus:ring-cyan-300"
                />
                <select
                  aria-label="Filter by test"
                  value={testFilter}
                  onChange={(event) => setTestFilter(event.target.value)}
                  className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 outline-none ring-1 ring-transparent focus:ring-cyan-300"
                >
                  <option value="">All tests</option>
                  {tests.map((test) => <option key={test} value={test}>{test}</option>)}
                </select>
                <select
                  aria-label="Filter by status"
                  value={statusFilter || ""}
                  onChange={(event) => onStatusFilterChange(event.target.value || null)}
                  className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 outline-none ring-1 ring-transparent focus:ring-cyan-300"
                >
                  <option value="">All statuses</option>
                  <option value="uploaded">Final</option>
                  <option value="drafted">Pending</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      {["Record / Pet", "Test", "Date", "Status", "Action"].map((heading) => (
                        <th key={heading} className="px-3 py-3 text-xs font-semibold text-slate-500">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageRecords.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-10 text-center text-sm text-slate-400">
                          No lab records found.
                        </td>
                      </tr>
                    ) : pageRecords.map((record) => (
                      <tr
                        key={record.id}
                        tabIndex={0}
                        aria-selected={activeRecord?.id === record.id}
                        onClick={() => setSelectedRecord(record)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedRecord(record);
                          }
                        }}
                        className={`cursor-pointer border-b border-slate-100 last:border-0 hover:bg-cyan-50 ${
                          activeRecord?.id === record.id ? "bg-cyan-50" : ""
                        }`}
                      >
                        <td className="px-3 py-3 text-sm text-slate-700">
                          <span className="block font-semibold">{formatRecordId(record.id)}</span>
                          <span className="block text-slate-500">{record.petName || "Patient not listed"}</span>
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-600">{record.recordTitle || record.type || "Laboratory"}</td>
                        <td className="px-3 py-3 text-sm text-slate-600">{formatDate(record.uploadedOn || record.createdAt)}</td>
                        <td className="px-3 py-3 text-sm text-slate-600">{isRecordUploaded(record) ? "Final" : "Pending"}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedRecord(record);
                                setScreen("details");
                              }}
                              className="text-sm font-medium text-cyan-700 hover:text-cyan-900"
                            >
                              View
                            </button>
                            {canManageRecords && (
                              <button
                                type="button"
                                aria-label={`Delete ${formatRecordId(record.id)}`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleDelete(record);
                                }}
                                className="rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                <span>
                  Showing {visibleRecords.length ? page * PAGE_SIZE + 1 : 0}–
                  {Math.min((page + 1) * PAGE_SIZE, visibleRecords.length)} of {visibleRecords.length} lab records
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page === 0}
                    onClick={() => setPage((current) => Math.max(0, current - 1))}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <span className="rounded-lg bg-slate-50 px-3 py-2">{page + 1}</span>
                  <button
                    type="button"
                    disabled={page + 1 >= pageCount}
                    onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        <aside className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-400">Selected patient</p>
          {selectedPet ? (
            <>
              <h3 className="mt-3 text-xl font-semibold text-slate-800">{selectedPet.petName || selectedPet.name}</h3>
              <span className="mt-2 inline-flex rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                Active patient
              </span>
              <p className="mt-3 text-sm text-slate-600">
                {[selectedPet.breed, selectedPet.gender, selectedPet.weight].filter(Boolean).join(" · ") || "Patient details unavailable"}
              </p>
              <div className="mt-4 space-y-1 text-sm text-slate-600">
                <p>Pet ID: {selectedPet.petID || selectedPet.id}</p>
                <p>Owner: {selectedPet.owner || activeRecord?.owner || "Not listed"}</p>
              </div>
              <div className="mt-4 rounded-xl bg-slate-50 p-3">
                <h4 className="text-sm font-semibold text-slate-800">Patient record summary</h4>
                <p className="mt-2 text-sm text-slate-600">{petRecords.length} lab {petRecords.length === 1 ? "record" : "records"}</p>
                {latestRecord && (
                  <p className="text-sm text-slate-600">
                    Latest record: {formatDate(latestRecord.uploadedOn || latestRecord.createdAt)}
                  </p>
                )}
              </div>
              {activeRecord && (
                <div className="mt-3 rounded-xl border border-cyan-100 bg-cyan-50 p-3">
                  <h4 className="text-sm font-semibold text-slate-800">Selected lab record</h4>
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {formatRecordId(activeRecord.id)} · {activeRecord.recordTitle || "Laboratory report"}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    {formatDate(activeRecord.uploadedOn || activeRecord.createdAt)} · {isRecordUploaded(activeRecord) ? "Final" : "Pending"}
                  </p>
                  {activeRecord.veterinarian && (
                    <p className="mt-1 text-xs text-slate-600">{activeRecord.veterinarian}</p>
                  )}
                </div>
              )}
              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                Keep laboratory reports connected to the correct patient.
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Patient information will appear here when available.</p>
          )}
        </aside>
      </div>
    </div>
  );
};

export default LaboratoryRecordsWorkspace;
