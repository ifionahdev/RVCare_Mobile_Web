import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Trash2 } from "lucide-react";
import api from "../../api/axios";
import MedicalHistoryForm from "./MedicalHistoryForm";
import downloadRecordAttachment from "./downloadRecordAttachment";

const PAGE_SIZE = 6;

const formatDate = (value) => {
  if (!value) return "Date not available";
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return "Date not available";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatVisitId = (id) => `VIS-${String(id ?? "").padStart(4, "0")}`;

const MedicalHistoryWorkspace = ({
  canManageRecords,
  setSuccessMessage,
  setErrorMessage,
}) => {
  const [workspace, setWorkspace] = useState({
    pets: [],
    visits: [],
    medicalHistories: [],
    labRecords: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [page, setPage] = useState(0);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [screen, setScreen] = useState("list");
  const [editingHistory, setEditingHistory] = useState(null);

  const refreshWorkspace = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setLoadError("");
    try {
      const response = await api.get("/records/workspace");
      const data = response.data;
      setWorkspace({
        pets: data.pets ?? [],
        visits: data.visits ?? [],
        medicalHistories: data.medicalHistories ?? [],
        labRecords: data.labRecords ?? [],
      });
      setSelectedHistory((current) => current
        ? (data.medicalHistories ?? []).find((history) => history.id === current.id) ?? null
        : null);
      return data;
    } catch (error) {
      console.error("Failed to load medical history records:", error);
      const message = error.response?.data?.message || "Medical history could not be loaded. Please try again.";
      setLoadError(message);
      return null;
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshWorkspace();
  }, [refreshWorkspace]);

  const histories = workspace.medicalHistories;
  const visitTypes = useMemo(
    () => [...new Set(histories.map((history) => history.serviceType).filter(Boolean))].sort(),
    [histories],
  );
  const filteredHistories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return histories
      .filter((history) => !typeFilter || history.serviceType === typeFilter)
      .filter((history) => (
        !query
        || formatVisitId(history.visitId).toLowerCase().includes(query)
        || String(history.visitId).includes(query)
        || history.petName?.toLowerCase().includes(query)
        || history.owner?.toLowerCase().includes(query)
        || history.assessment?.toLowerCase().includes(query)
      ))
      .sort((left, right) => {
        const leftDate = new Date(left.date || 0).getTime();
        const rightDate = new Date(right.date || 0).getTime();
        return sortOrder === "newest" ? rightDate - leftDate : leftDate - rightDate;
      });
  }, [histories, searchQuery, typeFilter, sortOrder]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, typeFilter, sortOrder]);

  const pageCount = Math.max(1, Math.ceil(filteredHistories.length / PAGE_SIZE));
  const pageHistories = filteredHistories.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const currentHistory = selectedHistory;
  const currentPet = workspace.pets.find((pet) => String(pet.petID || pet.id) === String(currentHistory?.petId))
    || (currentHistory ? {
      id: currentHistory.petId,
      petID: currentHistory.petId,
      petName: currentHistory.petName,
      owner: currentHistory.owner,
    } : null)
    || workspace.pets[0]
    || null;
  const patientVisits = currentPet
    ? workspace.visits.filter((visit) => String(visit.petId) === String(currentPet.petID || currentPet.id))
    : [];
  const patientHistories = currentPet
    ? histories.filter((history) => String(history.petId) === String(currentPet.petID || currentPet.id))
    : [];
  const patientLabRecords = currentPet
    ? workspace.labRecords.filter((record) => String(record.petID) === String(currentPet.petID || currentPet.id))
    : [];
  const latestVisit = [...patientVisits].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))[0];

  const openForm = (history = null) => {
    setEditingHistory(history);
    setScreen("form");
  };

  const backToList = () => {
    setScreen("list");
    setEditingHistory(null);
  };

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      const payload = {
        visitId: Number(formData.visitId),
        weight: formData.weight,
        temperature: formData.temperature,
        heartRate: formData.heartRate,
        complaint: formData.complaint,
        assessment: formData.assessment,
        treatment: formData.treatment,
        followUp: formData.followUp,
      };
      const body = new FormData();
      body.append("payload", JSON.stringify(payload));
      if (formData.attachment) body.append("attachment", formData.attachment);

      const url = editingHistory
        ? `/records/medical-histories/${editingHistory.id}`
        : "/records/medical-histories";
      const response = editingHistory
        ? await api.put(url, body)
        : await api.post(url, body);

      const data = await refreshWorkspace(false);
      if (!data) {
        setScreen("list");
        setEditingHistory(null);
        setErrorMessage("Medical history was saved, but the records list could not be refreshed.");
        return;
      }
      const savedHistory = data?.medicalHistories?.find((history) => history.id === response.data.id);
      setSelectedHistory(savedHistory ?? null);
      setScreen(savedHistory ? "details" : "list");
      setEditingHistory(null);
      setSuccessMessage(editingHistory ? "Medical history updated successfully." : "Medical history added successfully.");
    } catch (error) {
      console.error("Failed to save medical history:", error);
      setErrorMessage(error.response?.data?.message || "Medical history could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (history) => {
    if (!window.confirm(`Delete the medical history for ${history.petName}?`)) return;
    try {
      await api.delete(`/records/medical-histories/${history.id}`);
      setSelectedHistory(null);
      setScreen("list");
      const data = await refreshWorkspace(false);
      if (data) setSuccessMessage("Medical history deleted successfully.");
      else setErrorMessage("Medical history was deleted, but the records list could not be refreshed.");
    } catch (error) {
      console.error("Failed to delete medical history:", error);
      setErrorMessage(error.response?.data?.message || "Medical history could not be deleted.");
    }
  };

  const handleAttachmentDownload = async (attachment) => {
    try {
      await downloadRecordAttachment(attachment);
    } catch (error) {
      console.error("Failed to download medical attachment:", error);
      setErrorMessage(error.response?.data?.message || "Attachment could not be downloaded.");
    }
  };

  if (screen === "form") {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              {editingHistory ? "Edit medical history" : "Add medical history"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">Medical History / Record entry</p>
          </div>
          <button type="button" onClick={backToList} disabled={saving} className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 hover:bg-slate-200 disabled:opacity-60">
            Back to medical history
          </button>
        </div>
        <MedicalHistoryForm
          pets={workspace.pets}
          visits={workspace.visits}
          initialHistory={editingHistory}
          onCancel={backToList}
          onSave={handleSave}
          saving={saving}
        />
      </div>
    );
  }

  if (screen === "details" && currentHistory) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Medical history details</h2>
            <p className="mt-1 text-sm text-slate-500">Medical History / {formatVisitId(currentHistory.visitId)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={backToList} className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 hover:bg-slate-200">
              Back to medical history
            </button>
            {canManageRecords && (
              <>
                <button type="button" onClick={() => openForm(currentHistory)} className="rounded-lg bg-[#36c5e2] px-3 py-2 text-sm font-semibold text-white hover:bg-[#20b4d2]">
                  Edit record
                </button>
                <button type="button" onClick={() => handleDelete(currentHistory)} className="inline-flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100">
                  <Trash2 size={15} /> Delete
                </button>
              </>
            )}
          </div>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_278px]">
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{currentHistory.serviceType || "Patient visit"}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {formatVisitId(currentHistory.visitId)} · {formatDate(currentHistory.date)} · {currentHistory.veterinarian || "Veterinarian not listed"}
                </p>
              </div>
              <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                {(currentHistory.status || "Visit").replace(/_/g, " ")}
              </span>
            </div>

            <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600 sm:grid-cols-3">
              <div><span className="block text-xs text-slate-400">Visit time</span>{currentHistory.time || "Not recorded"}</div>
              <div><span className="block text-xs text-slate-400">Visit type</span>{currentHistory.visitType || "Not recorded"}</div>
              <div><span className="block text-xs text-slate-400">Weight</span>{currentHistory.weight ? `${currentHistory.weight} kg` : "Not recorded"}</div>
              <div><span className="block text-xs text-slate-400">Temperature</span>{currentHistory.temperature ? `${currentHistory.temperature} °C` : "Not recorded"}</div>
              <div><span className="block text-xs text-slate-400">Heart rate</span>{currentHistory.heartRate ? `${currentHistory.heartRate} bpm` : "Not recorded"}</div>
            </div>

            <div className="mt-5 space-y-4">
              {[
                ["Chief complaint & findings", currentHistory.complaint],
                ["Assessment / diagnosis", currentHistory.assessment],
                ["Treatment & care plan", currentHistory.treatment],
                ["Follow-up instructions", currentHistory.followUp],
              ].map(([label, value]) => (
                <section key={label}>
                  <h4 className="text-sm font-semibold text-slate-800">{label}</h4>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{value || "Not recorded."}</p>
                </section>
              ))}
            </div>

            {currentHistory.attachments?.length > 0 && (
              <section className="mt-5">
                <h4 className="text-sm font-semibold text-slate-800">Attachments</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {currentHistory.attachments.map((attachment) => (
                    <button
                      key={attachment.id}
                      type="button"
                      onClick={() => handleAttachmentDownload(attachment)}
                      className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-cyan-700 hover:bg-cyan-50"
                    >
                      <Download size={15} /> {attachment.originalName}
                    </button>
                  ))}
                </div>
              </section>
            )}
          </section>
          {renderPatientSummary(currentPet, patientLabRecords.length, patientHistories.length, latestVisit, currentHistory)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Medical history</h2>
          <p className="mt-1 text-sm text-slate-500">Review diagnoses, treatments and follow-up care by patient.</p>
        </div>
        {canManageRecords && (
          <button type="button" onClick={() => openForm()} className="rounded-lg bg-[#36c5e2] px-3 py-2 text-sm font-semibold text-white hover:bg-[#20b4d2]">
            + Add medical record
          </button>
        )}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_278px]">
        <section className="min-h-0 rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <input
              type="search"
              aria-label="Search medical history"
              placeholder="Search pet, owner or visit ID"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="min-w-[220px] flex-1 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none ring-1 ring-transparent placeholder:text-slate-400 focus:ring-cyan-300"
            />
            <select aria-label="Filter by visit type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 outline-none focus:ring-1 focus:ring-cyan-300">
              <option value="">All visit types</option>
              {visitTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            <select aria-label="Sort medical history" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 outline-none focus:ring-1 focus:ring-cyan-300">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-left">
              <thead className="bg-slate-50">
                <tr>
                  {["Visit / Pet", "Visit type", "Date", "Veterinarian", "Action"].map((heading) => (
                    <th key={heading} className="px-3 py-3 text-xs font-semibold text-slate-500">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="px-3 py-10 text-center text-sm text-slate-400">Loading medical history...</td></tr>
                ) : loadError ? (
                  <tr><td colSpan={5} className="px-3 py-10 text-center text-sm text-rose-600">{loadError}</td></tr>
                ) : pageHistories.length === 0 ? (
                  <tr><td colSpan={5} className="px-3 py-10 text-center text-sm text-slate-400">No medical history found.</td></tr>
                ) : pageHistories.map((history) => (
                  <tr
                    key={history.id}
                    tabIndex={0}
                    aria-selected={currentHistory?.id === history.id}
                    onClick={() => setSelectedHistory(history)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedHistory(history);
                      }
                    }}
                    className={`cursor-pointer border-b border-slate-100 last:border-0 hover:bg-cyan-50 ${
                      currentHistory?.id === history.id ? "bg-cyan-50" : ""
                    }`}
                  >
                    <td className="px-3 py-3 text-sm text-slate-700">
                      <span className="block font-semibold">{formatVisitId(history.visitId)}</span>
                      <span className="block text-slate-500">{history.petName || "Patient not listed"}</span>
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-600">{history.serviceType || history.visitType || "Visit"}</td>
                    <td className="px-3 py-3 text-sm text-slate-600">{formatDate(history.date)}</td>
                    <td className="px-3 py-3 text-sm text-slate-600">{history.veterinarian || "Not listed"}</td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedHistory(history);
                          setScreen("details");
                        }}
                        className="text-sm font-medium text-cyan-700 hover:text-cyan-900"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span>
              Showing {filteredHistories.length ? page * PAGE_SIZE + 1 : 0}–
              {Math.min((page + 1) * PAGE_SIZE, filteredHistories.length)} of {filteredHistories.length} medical records
            </span>
            <div className="flex items-center gap-2">
              <button type="button" disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))} className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-3 py-2 disabled:opacity-40">
                <ChevronLeft size={14} /> Previous
              </button>
              <span className="rounded-lg bg-slate-50 px-3 py-2">{page + 1}</span>
              <button type="button" disabled={page + 1 >= pageCount} onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))} className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-3 py-2 disabled:opacity-40">
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </section>
        {renderPatientSummary(currentPet, patientLabRecords.length, patientHistories.length, latestVisit, currentHistory)}
      </div>
    </div>
  );
};

const renderPatientSummary = (pet, labCount, historyCount, latestVisit, selectedHistory) => (
  <aside className="rounded-2xl bg-white p-4 shadow-sm">
    <p className="text-sm text-slate-400">Selected patient</p>
    {pet || selectedHistory ? (
      <>
        <h3 className="mt-3 text-xl font-semibold text-slate-800">{pet?.petName || pet?.name || selectedHistory?.petName}</h3>
        <span className="mt-2 inline-flex rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">Active patient</span>
        <p className="mt-3 text-sm text-slate-600">
          {[pet?.breed, pet?.gender, pet?.weight].filter(Boolean).join(" · ") || "Patient details unavailable"}
        </p>
        <div className="mt-4 space-y-1 text-sm text-slate-600">
          <p>Pet ID: {pet?.petID || pet?.id || selectedHistory?.petId || "Not listed"}</p>
          <p>Owner: {pet?.owner || selectedHistory?.owner || "Not listed"}</p>
          <p>Veterinarian: {selectedHistory?.veterinarian || latestVisit?.veterinarian || "Not listed"}</p>
        </div>
        <div className="mt-4 rounded-xl bg-slate-50 p-3">
          <h4 className="text-sm font-semibold text-slate-800">Patient record summary</h4>
          <p className="mt-2 text-sm text-slate-600">{labCount} lab records</p>
          <p className="text-sm text-slate-600">{historyCount} medical history records</p>
          <p className="text-sm text-slate-600">
            Latest visit: {latestVisit ? formatDate(latestVisit.date) : "No visits"}
          </p>
        </div>
        {selectedHistory && (
          <div className="mt-3 rounded-xl border border-cyan-100 bg-cyan-50 p-3">
            <h4 className="text-sm font-semibold text-slate-800">Selected medical record</h4>
            <p className="mt-2 text-sm font-medium text-slate-700">
              {formatVisitId(selectedHistory.visitId)} · {selectedHistory.serviceType || "Patient visit"}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {formatDate(selectedHistory.date)} · {(selectedHistory.status || "Visit").replace(/_/g, " ")}
            </p>
          </div>
        )}
      </>
    ) : (
      <p className="mt-3 text-sm text-slate-500">Patient information will appear here when available.</p>
    )}
  </aside>
);

export default MedicalHistoryWorkspace;
