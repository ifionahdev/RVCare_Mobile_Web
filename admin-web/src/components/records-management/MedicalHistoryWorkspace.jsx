import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import api from "../../api/axios";
import MedicalHistoryForm from "./MedicalHistoryForm";

const PAGE_SIZE = 6;

const formatDate = (value) => {
  if (!value) return "Date not available";
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return "Date not available";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatVisitId = (id) => `VIS-${String(id ?? "").padStart(4, "0")}`;

const MedicalHistoryWorkspace = ({ pets, labRecords, canManageRecords }) => {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [page, setPage] = useState(0);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [screen, setScreen] = useState("list");
  const [editingVisit, setEditingVisit] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchVisits = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const response = await api.get("/admin/appointments");
        if (active) {
          setVisits(Array.isArray(response.data.cleanedVisits) ? response.data.cleanedVisits : []);
        }
      } catch (error) {
        console.error("Failed to load medical history visits:", error);
        if (active) setLoadError("Medical history could not be loaded. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchVisits();
    return () => {
      active = false;
    };
  }, []);

  const visitTypes = useMemo(
    () => [...new Set(visits.map((visit) => visit.serviceType).filter(Boolean))].sort(),
    [visits]
  );

  const filteredVisits = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return visits
      .filter((visit) => !typeFilter || visit.serviceType === typeFilter)
      .filter((visit) => (
        !query
        || formatVisitId(visit.id).toLowerCase().includes(query)
        || String(visit.id).includes(query)
        || visit.petName?.toLowerCase().includes(query)
        || visit.owner?.toLowerCase().includes(query)
      ))
      .sort((left, right) => {
        const leftDate = new Date(left.date || 0).getTime();
        const rightDate = new Date(right.date || 0).getTime();
        return sortOrder === "newest" ? rightDate - leftDate : leftDate - rightDate;
      });
  }, [visits, searchQuery, typeFilter, sortOrder]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, typeFilter, sortOrder]);

  const pageCount = Math.max(1, Math.ceil(filteredVisits.length / PAGE_SIZE));
  const pageVisits = filteredVisits.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const currentVisit = selectedVisit || null;
  const currentPet = pets.find((pet) => String(pet.petID || pet.id) === String(currentVisit?.petId))
    || (currentVisit ? {
      id: currentVisit.petId,
      petID: currentVisit.petId,
      petName: currentVisit.petName,
      owner: currentVisit.owner
    } : null)
    || pets[0]
    || null;
  const patientVisits = currentPet
    ? visits.filter((visit) => String(visit.petId) === String(currentPet.petID || currentPet.id))
    : [];
  const patientLabRecords = currentPet
    ? labRecords.filter((record) => String(record.petID) === String(currentPet.petID || currentPet.id))
    : [];
  const latestVisit = [...patientVisits].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))[0];

  const openForm = (visit = null) => {
    setEditingVisit(visit);
    setScreen("form");
  };

  const backToList = () => {
    setScreen("list");
    setEditingVisit(null);
  };

  if (screen === "form") {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              {editingVisit ? "Add or edit medical history" : "Add medical history"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">Medical History / Record entry</p>
          </div>
          <button type="button" onClick={backToList} className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 hover:bg-slate-200">
            Back to medical history
          </button>
        </div>
        <MedicalHistoryForm
          pets={pets}
          visits={visits}
          records={labRecords}
          initialVisit={editingVisit}
          onCancel={backToList}
        />
      </div>
    );
  }

  if (screen === "details" && currentVisit) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Medical history details</h2>
            <p className="mt-1 text-sm text-slate-500">Medical History / {formatVisitId(currentVisit.id)}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={backToList} className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 hover:bg-slate-200">
              Back to medical history
            </button>
            {canManageRecords && (
              <button type="button" onClick={() => openForm(currentVisit)} className="rounded-lg bg-[#36c5e2] px-3 py-2 text-sm font-semibold text-white hover:bg-[#20b4d2]">
                Edit record
              </button>
            )}
          </div>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_278px]">
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{currentVisit.serviceType || "Patient visit"}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {formatVisitId(currentVisit.id)} · {formatDate(currentVisit.date)} · {currentVisit.veterinarian || "Veterinarian not listed"}
                </p>
              </div>
              <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                {(currentVisit.status || "Visit").replace(/_/g, " ")}
              </span>
            </div>

            <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600 sm:grid-cols-3">
              <div><span className="block text-xs text-slate-400">Visit time</span>{currentVisit.time || "Not recorded"}</div>
              <div><span className="block text-xs text-slate-400">Visit type</span>{currentVisit.visitType || "Not recorded"}</div>
              <div><span className="block text-xs text-slate-400">Service</span>{currentVisit.serviceType || "Not recorded"}</div>
            </div>

            <div className="mt-5 space-y-4">
              <section>
                <h4 className="text-sm font-semibold text-slate-800">Visit description</h4>
                <p className="mt-1 text-sm text-slate-600">{currentVisit.description || "No visit description is available."}</p>
              </section>
              <section>
                <h4 className="text-sm font-semibold text-slate-800">Clinical findings & care plan</h4>
                <p className="mt-1 rounded-lg bg-cyan-50 p-3 text-sm text-slate-600">
                  Clinical notes, diagnosis, treatment, and follow-up details are not available for this visit.
                </p>
              </section>
            </div>
          </section>
          {renderPatientSummary(currentPet, patientLabRecords.length, patientVisits.length, latestVisit, currentVisit)}
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
                ) : pageVisits.length === 0 ? (
                  <tr><td colSpan={5} className="px-3 py-10 text-center text-sm text-slate-400">No medical history found.</td></tr>
                ) : pageVisits.map((visit) => (
                  <tr
                    key={visit.id}
                    tabIndex={0}
                    aria-selected={currentVisit?.id === visit.id}
                    onClick={() => setSelectedVisit(visit)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedVisit(visit);
                      }
                    }}
                    className={`cursor-pointer border-b border-slate-100 last:border-0 hover:bg-cyan-50 ${
                      currentVisit?.id === visit.id ? "bg-cyan-50" : ""
                    }`}
                  >
                    <td className="px-3 py-3 text-sm text-slate-700">
                      <span className="block font-semibold">{formatVisitId(visit.id)}</span>
                      <span className="block text-slate-500">{visit.petName || "Patient not listed"}</span>
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-600">{visit.serviceType || visit.visitType || "Visit"}</td>
                    <td className="px-3 py-3 text-sm text-slate-600">{formatDate(visit.date)}</td>
                    <td className="px-3 py-3 text-sm text-slate-600">{visit.veterinarian || "Not listed"}</td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedVisit(visit);
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
              Showing {filteredVisits.length ? page * PAGE_SIZE + 1 : 0}–
              {Math.min((page + 1) * PAGE_SIZE, filteredVisits.length)} of {filteredVisits.length} medical records
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
        {renderPatientSummary(currentPet, patientLabRecords.length, patientVisits.length, latestVisit, currentVisit)}
      </div>
    </div>
  );
};

const renderPatientSummary = (pet, labCount, visitCount, latestVisit, selectedVisit) => (
  <aside className="rounded-2xl bg-white p-4 shadow-sm">
    <p className="text-sm text-slate-400">Selected patient</p>
    {pet || selectedVisit ? (
      <>
        <h3 className="mt-3 text-xl font-semibold text-slate-800">{pet?.petName || pet?.name || selectedVisit?.petName}</h3>
        <span className="mt-2 inline-flex rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">Active patient</span>
        <p className="mt-3 text-sm text-slate-600">
          {[pet?.breed, pet?.gender, pet?.weight].filter(Boolean).join(" · ") || "Patient details unavailable"}
        </p>
        <div className="mt-4 space-y-1 text-sm text-slate-600">
          <p>Pet ID: {pet?.petID || pet?.id || selectedVisit?.petId || "Not listed"}</p>
          <p>Owner: {pet?.owner || selectedVisit?.owner || "Not listed"}</p>
          <p>Veterinarian: {selectedVisit?.veterinarian || latestVisit?.veterinarian || "Not listed"}</p>
        </div>
        <div className="mt-4 rounded-xl bg-slate-50 p-3">
          <h4 className="text-sm font-semibold text-slate-800">Patient record summary</h4>
          <p className="mt-2 text-sm text-slate-600">{labCount} lab records</p>
          <p className="text-sm text-slate-600">{visitCount} medical visits</p>
          <p className="text-sm text-slate-600">
            Latest visit: {latestVisit ? formatDate(latestVisit.date) : "No visits"}
          </p>
        </div>
        {selectedVisit && (
          <div className="mt-3 rounded-xl border border-cyan-100 bg-cyan-50 p-3">
            <h4 className="text-sm font-semibold text-slate-800">Selected medical record</h4>
            <p className="mt-2 text-sm font-medium text-slate-700">
              {formatVisitId(selectedVisit.id)} · {selectedVisit.serviceType || selectedVisit.visitType || "Patient visit"}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {formatDate(selectedVisit.date)} · {(selectedVisit.status || "Visit").replace(/_/g, " ")}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {selectedVisit.veterinarian || "Veterinarian not listed"}
            </p>
          </div>
        )}
        <p className="mt-3 text-xs leading-relaxed text-slate-400">
          Keep visit history and clinical notes connected to the correct patient.
        </p>
      </>
    ) : (
      <p className="mt-3 text-sm text-slate-500">Patient information will appear here when available.</p>
    )}
  </aside>
);

export default MedicalHistoryWorkspace;
