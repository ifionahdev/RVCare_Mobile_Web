import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Plus, Trash2 } from "lucide-react";
import api from "../../api/axios";
import LabRecordForm from "./LabRecordForm";
import downloadRecordAttachment from "./downloadRecordAttachment";

const PAGE_SIZE = 6;

const isRecordUploaded = (record) => Boolean(record?.isUploaded);

const formatDate = (value) => {
  if (!value) return "Date not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not available";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatRecordId = (id) => `LAB-${String(id ?? "").padStart(4, "0")}`;

const LaboratoryRecordsWorkspace = ({
  canManageRecords,
  searchQuery,
  setSearchQuery,
  statusFilter,
  onStatusFilterChange,
  setSuccessMessage,
  setErrorMessage,
}) => {
  const [workspace, setWorkspace] = useState({
    pets: [],
    visits: [],
    appointments: [],
    labRecords: [],
    labTypes: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [testFilter, setTestFilter] = useState("");
  const [page, setPage] = useState(0);
  const [screen, setScreen] = useState("list");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);

  const refreshWorkspace = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setLoadError("");
    try {
      const response = await api.get("/records/workspace");
      const data = response.data;
      setWorkspace({
        pets: data.pets ?? [],
        visits: data.visits ?? [],
        appointments: data.availableAppointments ?? [],
        labRecords: data.labRecords ?? [],
        labTypes: data.labTypes ?? [],
      });
      setSelectedRecord((current) => current
        ? (data.labRecords ?? []).find((record) => record.id === current.id) ?? null
        : null);
      return data;
    } catch (error) {
      console.error("Failed to load lab records:", error);
      setLoadError(error.response?.data?.message || "Lab records could not be loaded. Please try again.");
      return null;
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshWorkspace();
  }, [refreshWorkspace]);

  const tests = useMemo(
    () => [...new Set(workspace.labRecords.map((record) => record.recordTitle).filter(Boolean))].sort(),
    [workspace.labRecords],
  );
  const visibleRecords = workspace.labRecords.filter((record) => (
    (!testFilter || record.recordTitle === testFilter)
    && (!statusFilter || (statusFilter === "uploaded" ? isRecordUploaded(record) : !isRecordUploaded(record)))
    && (
      !searchQuery.trim()
      || formatRecordId(record.id).toLowerCase().includes(searchQuery.trim().toLowerCase())
      || record.petName?.toLowerCase().includes(searchQuery.trim().toLowerCase())
      || record.owner?.toLowerCase().includes(searchQuery.trim().toLowerCase())
      || record.recordTitle?.toLowerCase().includes(searchQuery.trim().toLowerCase())
    )
  ));
  const pageCount = Math.max(1, Math.ceil(visibleRecords.length / PAGE_SIZE));
  const pageRecords = visibleRecords.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const activeRecord = selectedRecord;
  const selectedPet = workspace.pets.find((pet) => String(pet.petID || pet.id) === String(activeRecord?.petID))
    || (activeRecord ? {
      id: activeRecord.petID,
      petID: activeRecord.petID,
      petName: activeRecord.petName,
      owner: activeRecord.owner,
    } : null)
    || workspace.pets[0]
    || null;
  const petRecords = selectedPet
    ? workspace.labRecords.filter((record) => String(record.petID) === String(selectedPet.petID || selectedPet.id))
    : [];
  const latestRecord = petRecords.reduce((latest, record) => {
    const date = new Date(record.uploadedOn || 0);
    return !latest || date > latest.date ? { record, date } : latest;
  }, null)?.record;

  useEffect(() => {
    setPage(0);
  }, [searchQuery, testFilter, statusFilter]);

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, pageCount - 1));
  }, [pageCount]);

  const backToList = () => {
    setScreen("list");
    setEditingRecord(null);
    setSelectedRecord(null);
  };

  const openForm = (record = null) => {
    setEditingRecord(record);
    setScreen("form");
  };

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      const payload = {
        ...(formData.appointmentId
          ? { appointmentId: Number(formData.appointmentId) }
          : { visitId: Number(formData.visitId) }),
        testType: formData.testType,
        interpretation: formData.interpretation,
        results: formData.results,
      };
      const body = new FormData();
      body.append("payload", JSON.stringify(payload));
      if (formData.attachment) body.append("attachment", formData.attachment);

      const response = editingRecord
        ? await api.put(`/records/lab-results/${editingRecord.id}`, body)
        : await api.post("/records/lab-results", body);
      const data = await refreshWorkspace(false);
      if (!data) {
        setScreen("list");
        setEditingRecord(null);
        setErrorMessage("Lab record was saved, but the records list could not be refreshed.");
        return;
      }
      const savedRecord = data?.labRecords?.find((record) => record.id === response.data.id);
      setSelectedRecord(savedRecord ?? null);
      setScreen(savedRecord ? "details" : "list");
      setEditingRecord(null);
      setSuccessMessage(editingRecord ? "Lab record updated successfully." : "Lab record added successfully.");
    } catch (error) {
      console.error("Failed to save lab record:", error);
      setErrorMessage(error.response?.data?.message || "Lab record could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    if (!window.confirm(`Delete ${formatRecordId(record.id)} for ${record.petName}?`)) return;
    try {
      await api.delete(`/records/lab-results/${record.id}`);
      setSelectedRecord(null);
      setScreen("list");
      const data = await refreshWorkspace(false);
      if (data) setSuccessMessage("Lab record deleted successfully.");
      else setErrorMessage("Lab record was deleted, but the records list could not be refreshed.");
    } catch (error) {
      console.error("Failed to delete lab record:", error);
      setErrorMessage(error.response?.data?.message || "Lab record could not be deleted.");
    }
  };

  const handleAttachmentDownload = async (attachment) => {
    try {
      await downloadRecordAttachment(attachment);
    } catch (error) {
      console.error("Failed to download lab attachment:", error);
      setErrorMessage(error.response?.data?.message || "Attachment could not be downloaded.");
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
          <button type="button" onClick={backToList} disabled={saving} className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 hover:bg-slate-200 disabled:opacity-60">
            Back to lab records
          </button>
        </div>
        <LabRecordForm
          record={editingRecord}
          pets={workspace.pets}
          visits={workspace.visits}
          appointments={workspace.appointments}
          testTypes={workspace.labTypes}
          onCancel={backToList}
          onSave={handleSave}
          saving={saving}
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
              : "Laboratory results saved to patient visits."}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {screen === "details" && activeRecord && (
            <button type="button" onClick={backToList} className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-200">
              <ArrowLeft size={16} /> Back to lab records
            </button>
          )}
          {screen === "list" && canManageRecords && (
            <button type="button" onClick={() => openForm()} className="inline-flex items-center gap-2 rounded-lg bg-[#36c5e2] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#20b4d2]">
              <Plus size={16} /> Add lab record
            </button>
          )}
          {screen === "details" && activeRecord && canManageRecords && (
            <>
              <button type="button" onClick={() => openForm(activeRecord)} className="rounded-lg bg-[#36c5e2] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#20b4d2]">
                Edit record
              </button>
              <button type="button" onClick={() => handleDelete(activeRecord)} className="inline-flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100">
                <Trash2 size={15} /> Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_278px]">
        <section className="min-h-0 rounded-2xl bg-white p-4 shadow-sm">
          {screen === "details" && activeRecord ? (
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">{activeRecord.recordTitle || "Laboratory report"}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatRecordId(activeRecord.id)} <span className="px-1">·</span>
                    {formatDate(activeRecord.uploadedOn)}
                  </p>
                </div>
                <span className={`rounded-md px-2 py-1 text-xs font-medium ${
                  isRecordUploaded(activeRecord) ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                }`}>
                  {isRecordUploaded(activeRecord) ? "Final" : "Pending"}
                </span>
              </div>

              <div className="mt-6 grid gap-3 border-y border-slate-100 py-4 sm:grid-cols-2">
                <div><p className="text-xs font-medium text-slate-400">Patient</p><p className="mt-1 text-sm text-slate-700">{activeRecord.petName || "Patient not listed"}</p></div>
                <div><p className="text-xs font-medium text-slate-400">Owner</p><p className="mt-1 text-sm text-slate-700">{activeRecord.owner || "Owner not listed"}</p></div>
                <div><p className="text-xs font-medium text-slate-400">Veterinarian</p><p className="mt-1 text-sm text-slate-700">{activeRecord.veterinarian || "Not listed"}</p></div>
                <div>
                  <p className="text-xs font-medium text-slate-400">
                    {activeRecord.appointmentId ? "Appointment" : "Visit"}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {activeRecord.appointmentId
                      ? `APT-${String(activeRecord.appointmentId).padStart(4, "0")}`
                      : `VIS-${String(activeRecord.visitId).padStart(4, "0")}`}
                  </p>
                </div>
              </div>

              <h4 className="mt-5 text-sm font-semibold text-slate-800">Lab results</h4>
              {activeRecord.results?.length > 0 ? (
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
                <p className="mt-2 text-sm text-slate-500">No result values have been entered.</p>
              )}
              {activeRecord.interpretation && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-slate-800">Clinical interpretation</h4>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{activeRecord.interpretation}</p>
                </div>
              )}
              {activeRecord.attachments?.length > 0 && (
                <div className="mt-5">
                  <h4 className="text-sm font-semibold text-slate-800">Attachments</h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {activeRecord.attachments.map((attachment) => (
                      <button key={attachment.id} type="button" onClick={() => handleAttachmentDownload(attachment)} className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-cyan-700 hover:bg-cyan-50">
                        <Download size={15} /> {attachment.originalName}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
                <select aria-label="Filter by test" value={testFilter} onChange={(event) => setTestFilter(event.target.value)} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 outline-none ring-1 ring-transparent focus:ring-cyan-300">
                  <option value="">All tests</option>
                  {tests.map((test) => <option key={test} value={test}>{test}</option>)}
                </select>
                <select aria-label="Filter by status" value={statusFilter || ""} onChange={(event) => onStatusFilterChange(event.target.value || null)} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 outline-none ring-1 ring-transparent focus:ring-cyan-300">
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
                    {loading ? (
                      <tr><td colSpan={5} className="px-3 py-10 text-center text-sm text-slate-400">Loading lab records...</td></tr>
                    ) : loadError ? (
                      <tr><td colSpan={5} className="px-3 py-10 text-center text-sm text-rose-600">{loadError}</td></tr>
                    ) : pageRecords.length === 0 ? (
                      <tr><td colSpan={5} className="px-3 py-10 text-center text-sm text-slate-400">No lab records found.</td></tr>
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
                        <td className="px-3 py-3 text-sm text-slate-600">{record.recordTitle || "Laboratory"}</td>
                        <td className="px-3 py-3 text-sm text-slate-600">{formatDate(record.uploadedOn)}</td>
                        <td className="px-3 py-3 text-sm text-slate-600">{isRecordUploaded(record) ? "Final" : "Pending"}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <button type="button" onClick={(event) => {
                              event.stopPropagation();
                              setSelectedRecord(record);
                              setScreen("details");
                            }} className="text-sm font-medium text-cyan-700 hover:text-cyan-900">
                              View
                            </button>
                            {canManageRecords && (
                              <button type="button" aria-label={`Delete ${formatRecordId(record.id)}`} onClick={(event) => {
                                event.stopPropagation();
                                handleDelete(record);
                              }} className="rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600">
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
                  <button type="button" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))} className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40">
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <span className="rounded-lg bg-slate-50 px-3 py-2">{page + 1}</span>
                  <button type="button" disabled={page + 1 >= pageCount} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40">
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
              <span className="mt-2 inline-flex rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">Active patient</span>
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
                {latestRecord && <p className="text-sm text-slate-600">Latest record: {formatDate(latestRecord.uploadedOn)}</p>}
              </div>
              {activeRecord && (
                <div className="mt-3 rounded-xl border border-cyan-100 bg-cyan-50 p-3">
                  <h4 className="text-sm font-semibold text-slate-800">Selected lab record</h4>
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {formatRecordId(activeRecord.id)} · {activeRecord.recordTitle}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    {formatDate(activeRecord.uploadedOn)} · {isRecordUploaded(activeRecord) ? "Final" : "Pending"}
                  </p>
                  {activeRecord.veterinarian && <p className="mt-1 text-xs text-slate-600">{activeRecord.veterinarian}</p>}
                </div>
              )}
              <p className="mt-3 text-xs leading-relaxed text-slate-400">Lab results remain connected to their patient visit.</p>
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
