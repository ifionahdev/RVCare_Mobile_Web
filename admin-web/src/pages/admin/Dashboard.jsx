import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios.js";
import {
  LayoutDashboard, CalendarDays, UsersRound, PawPrint, FileText,
  Stethoscope, Settings, LogOut, Menu, X, ChevronLeft,
  ChevronRight, Clock3, CheckCircle2, ClipboardList,
  Bell, CalendarCheck2, AlertCircle, Activity, ArrowUpRight
} from "lucide-react";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, active: true },
  { name: "Appointments", icon: CalendarDays },
  { name: "Customers & Pets", icon: UsersRound },
  { name: "Medical Records", icon: FileText },
  { name: "Lab Reports", icon: ClipboardList },
  { name: "Veterinarians", icon: Stethoscope },
  { name: "Settings", icon: Settings },
];
const appointmentStatuses = [
  { label: "Pending", color: "bg-amber-400" },
  { label: "Upcoming", color: "bg-[#078c9d]" },
  { label: "Rejected", color: "bg-orange-400" },
  { label: "Completed", color: "bg-emerald-400" },
  { label: "Missed", color: "bg-slate-400" },
  { label: "Cancelled", color: "bg-rose-400" },
];
function StatCard({ title, value, icon: Icon, note, accent }) {
  return <div className="rounded-2xl border border-[#e1e8ee] bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3"><span className="text-sm font-semibold text-slate-500">{title}</span><span className={`rounded-xl p-3 ${accent}`}><Icon size={20}/></span></div>
    <div className="mt-3 text-3xl font-extrabold tracking-tight text-[#1d293b]">{value}</div>
    <p className="mt-2 text-xs text-slate-500">{note}</p>
  </div>;
}
export default function AdminDashboard() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [kpis, setKpis] = useState({
    customers: null,
    pets: null,
    pending: null,
    todayPending: null,
  });
  const [kpiLoading, setKpiLoading] = useState(true);
  const [kpiError, setKpiError] = useState("");
  const [statusCounts, setStatusCounts] = useState({});
  const navigate = useNavigate();
  useEffect(() => {
    let active = true;

    const loadKpis = async () => {
      try {
        const [customers, pets, pending, today, statuses] = await Promise.all([
          api.get("/customers/count"),
          api.get("/pets/count"),
          api.get("/appointments/count/pending"),
          api.get("/appointments/count/today"),
          api.get("/appointments/count/status"),
        ]);

        if (!active) return;
        setKpis({
          customers: customers.data.count,
          pets: pets.data.count,
          pending: pending.data.count,
          todayPending: today.data.count,
        });
        setStatusCounts(statuses.data);
      } catch (error) {
        if (!active) return;
        setKpiError(
          error.response?.data?.message ??
            "Unable to load dashboard metrics.",
        );
      } finally {
        if (active) setKpiLoading(false);
      }
    };

    loadKpis();

    return () => {
      active = false;
    };
  }, []);
  const logout = () => { sessionStorage.removeItem("raphacare_demo_admin"); navigate("/login", { replace: true }); };
  const sidebar = <div className="flex h-full flex-col bg-[#1e293b] text-white">
    <div className="flex min-h-[88px] items-center justify-between gap-2 border-b border-white/10 px-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white p-1"><img src="/assets/raphacare-logo.png" alt="RaphaCare" className="h-full w-full object-contain" /></span>
        {!collapsed && <div className="min-w-0"><p className="truncate text-base font-extrabold">RaphaCare</p><p className="text-xs text-cyan-300">Clinic Administration</p></div>}
      </div>
      <button className="rounded-lg p-2 text-slate-300 hover:bg-white/10 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={20}/></button>
    </div>
    <nav className="flex-1 space-y-1 px-3 py-6" aria-label="Main navigation">
      {navItems.map(({ name, icon: Icon, active }) => <div key={name}>
        <button type="button" disabled={!active} title={!active ? `${name} — coming later` : name}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold ${active ? "bg-[#078c9d] text-white" : "cursor-not-allowed text-slate-400 opacity-75"}`}>
          <Icon size={19} className="shrink-0" />{!collapsed && <span className="truncate">{name}</span>}
        </button>
      </div>)}
    </nav>
    <div className="border-t border-white/10 p-3">
      <div className="flex items-center gap-3 rounded-xl px-3 py-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-sm font-bold text-[#087e8c]">A</div>{!collapsed && <div className="min-w-0"><p className="truncate text-sm font-semibold">Demo Administrator</p><p className="text-xs text-slate-400">Preview account</p></div>}</div>
      <button onClick={logout} title="Sign out" className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-300 hover:bg-white/10"><LogOut size={19}/>{!collapsed && "Sign out"}</button>
    </div>
  </div>;
  return <div className="min-h-screen bg-[#f6f8fb] text-[#1e293b]">
    {mobileOpen && <div className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden" onClick={() => setMobileOpen(false)} />}
    <aside className={`fixed inset-y-0 left-0 z-50 w-[260px] transform transition-transform duration-200 lg:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>{sidebar}</aside>
    <aside className={`fixed inset-y-0 left-0 z-30 hidden transition-all duration-200 lg:block ${collapsed ? "w-[86px]" : "w-[260px]"}`}>{sidebar}</aside>
    <div className={`min-w-0 transition-all duration-200 ${collapsed ? "lg:pl-[86px]" : "lg:pl-[260px]"}`}>
      <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between gap-3 border-b border-[#e1e8ee] bg-white px-4 sm:px-7">
        <div className="flex items-center gap-3"><button onClick={() => { if (window.innerWidth < 1024) setMobileOpen(true); else setCollapsed(!collapsed); }} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="Toggle sidebar"><Menu size={22}/></button><div><h1 className="text-lg font-extrabold sm:text-xl">Dashboard</h1><p className="hidden text-xs text-slate-500 sm:block">Clinic overview</p></div></div>
        <div className="flex items-center gap-3"><span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-800">Demo data</span><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e2f5f7] font-bold text-[#078c9d]">A</div></div>
      </header>
      <main className="mx-auto max-w-[1550px] space-y-6 px-4 py-7 sm:px-7">
        <div><h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Clinic overview</h2><p className="mt-1 text-sm text-slate-500">A quick look at appointments and patient records.</p></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total customers" value={kpiLoading ? "..." : kpiError ? "—" : kpis.customers} icon={UsersRound} note="Registered customer accounts" accent="bg-sky-50 text-sky-700" />
          <StatCard title="Registered pets" value={kpiLoading ? "..." : kpiError ? "—" : kpis.pets} icon={PawPrint} note="Active pet profiles" accent="bg-violet-50 text-violet-700" />
          <StatCard title="Pending requests" value={kpiLoading ? "..." : kpiError ? "—" : kpis.pending} icon={Clock3} note="Awaiting clinic review" accent="bg-orange-50 text-orange-700" />
          <StatCard title="Today's appointments" value={kpiLoading ? "..." : kpiError ? "—" : kpis.todayPending} icon={CalendarCheck2} note="Pending appointments today" accent="bg-emerald-50 text-emerald-700" />
        </div>
        {kpiError && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{kpiError}</p>}
        <div className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
          <section className="rounded-2xl border border-[#e1e8ee] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-base font-extrabold">Appointment status</h3><p className="mt-1 text-xs text-slate-500">Current appointment distribution by status</p></div><Activity size={19} className="text-[#078c9d]" /></div>
            <div className="mt-6 space-y-5">{appointmentStatuses.map(({ label, color }) => <div key={label}><div className="mb-2 flex justify-between text-sm"><span className="font-semibold">{label}</span><span className="font-bold text-slate-600">{kpiLoading ? "..." : kpiError ? "—" : statusCounts[label] ?? 0}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${(statusCounts[label] ?? 0) / Math.max(1, Object.values(statusCounts).reduce((sum, count) => sum + count, 0)) * 100}%` }} /></div></div>)}</div>
            <p className="mt-5 text-xs text-slate-400">Live appointment status counts.</p>
          </section>
          <section className="rounded-2xl border border-[#e1e8ee] bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h3 className="text-base font-extrabold">Upcoming schedule</h3><p className="mt-1 text-xs text-slate-500">Sample confirmed appointments</p></div><CalendarDays size={19} className="text-[#078c9d]" /></div>
            <div className="mt-5 space-y-4">{[{time:"9:00 AM",pet:"Luna",service:"Vaccination",vet:"Dr. E. Reyes"},{time:"11:30 AM",pet:"Biscuit",service:"General Checkup",vet:"Dr. E. Reyes"},{time:"2:00 PM",pet:"Max",service:"Follow-up",vet:"Dr. M. Santos"}].map((a,i)=><div key={i} className="flex gap-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0"><div className="min-w-[78px] rounded-lg bg-[#eaf6f8] px-2 py-2 text-center text-xs font-bold text-[#078c9d]">{a.time}</div><div><p className="text-sm font-bold">{a.pet} <span className="font-normal text-slate-500">· {a.service}</span></p><p className="mt-1 text-xs text-slate-500">{a.vet}</p></div></div>)}</div>
          </section>
        </div>
        <section className="overflow-hidden rounded-2xl border border-[#e1e8ee] bg-white shadow-sm"><div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center"><div><h3 className="text-base font-extrabold">Recent appointment requests</h3><p className="mt-1 text-xs text-slate-500">Preview of the clinic's appointment list</p></div></div>
          <div className="px-5 py-10 text-center text-sm text-slate-500">Appointment list integration is not connected yet.</div>
        </section>
        <p className="pb-4 text-xs text-slate-400">RaphaCare admin dashboard preview · Light mode · Sample data only · No real appointments are changed.</p>
      </main>
    </div>
  </div>;
}
