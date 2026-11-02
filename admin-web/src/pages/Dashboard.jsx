import React, { useCallback, useEffect, useState } from "react";
import {
  CalendarCheck2,
  CalendarDays,
  Clock3,
  PawPrint,
  UsersRound,
  Activity,
} from "lucide-react";
import api from "../api/authAxios.js";
import socket from "../socket.js";

const appointmentStatuses = [
  { label: "Pending", color: "bg-amber-400" },
  { label: "Upcoming", color: "bg-[#078c9d]" },
  { label: "Rejected", color: "bg-orange-400" },
  { label: "Completed", color: "bg-emerald-400" },
  { label: "Missed", color: "bg-slate-400" },
  { label: "Cancelled", color: "bg-rose-400" },
];

function StatCard({ title, value, icon: Icon, note, accent }) {
  return (
    <div className="rounded-2xl border border-[#e1e8ee] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-semibold text-slate-500">{title}</span>
        <span className={`rounded-xl p-3 ${accent}`}><Icon size={20} /></span>
      </div>
      <div className="mt-3 text-3xl font-extrabold tracking-tight text-[#1d293b]">{value}</div>
      <p className="mt-2 text-xs text-slate-500">{note}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [kpis, setKpis] = useState({
    customers: null,
    pets: null,
    pending: null,
    today: null,
  });
  const [statusCounts, setStatusCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [customers, pets, pending, today, statuses] = await Promise.all([
        api.get("/customers/count"),
        api.get("/pets/count"),
        api.get("/appointments/count/pending"),
        api.get("/appointments/count/today"),
        api.get("/appointments/count/status"),
      ]);

      setKpis({
        customers: customers.data.count,
        pets: pets.data.count,
        pending: pending.data.count,
        today: today.data.count,
      });
      setStatusCounts(statuses.data ?? {});
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to load dashboard metrics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    socket.connect();
    socket.on("appointments_updated", loadDashboard);
    socket.on("owner_created", loadDashboard);
    socket.on("pet_created", loadDashboard);
    socket.on("pets_updated", loadDashboard);

    return () => {
      socket.off("appointments_updated", loadDashboard);
      socket.off("owner_created", loadDashboard);
      socket.off("pet_created", loadDashboard);
      socket.off("pets_updated", loadDashboard);
    };
  }, [loadDashboard]);

  const totalStatuses = Object.values(statusCounts).reduce(
    (total, count) => total + Number(count || 0),
    0,
  );

  const metricValue = (value) => (loading ? "..." : error ? "--" : value);

  return (
    <div className="min-h-full bg-[#f6f8fb] text-[#1e293b]">
      <main className="mx-auto max-w-[1550px] space-y-6 px-4 py-7 sm:px-7">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Clinic overview</h1>
          <p className="mt-1 text-sm text-slate-500">A quick look at appointments and patient records.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total customers" value={metricValue(kpis.customers)} icon={UsersRound} note="Registered customer accounts" accent="bg-sky-50 text-sky-700" />
          <StatCard title="Registered pets" value={metricValue(kpis.pets)} icon={PawPrint} note="Active pet profiles" accent="bg-violet-50 text-violet-700" />
          <StatCard title="Pending requests" value={metricValue(kpis.pending)} icon={Clock3} note="Awaiting clinic review" accent="bg-orange-50 text-orange-700" />
          <StatCard title="Today's appointments" value={metricValue(kpis.today)} icon={CalendarCheck2} note="Appointments scheduled today" accent="bg-emerald-50 text-emerald-700" />
        </div>

        {error && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
        )}

        <section className="rounded-2xl border border-[#e1e8ee] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold">Upcoming schedule</h2>
              <p className="mt-1 text-xs text-slate-500">Confirmed appointments</p>
            </div>
            <CalendarDays size={19} className="text-[#078c9d]" />
          </div>
          <div className="mt-5 space-y-4">
            {[
              { time: "9:00 AM", pet: "Luna", service: "Vaccination", vet: "Dr. E. Reyes" },
              { time: "11:30 AM", pet: "Biscuit", service: "General Checkup", vet: "Dr. E. Reyes" },
              { time: "2:00 PM", pet: "Max", service: "Follow-up", vet: "Dr. M. Santos" },
            ].map((appointment, index) => (
              <div key={index} className="flex gap-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                <div className="min-w-[78px] rounded-lg bg-[#eaf6f8] px-2 py-2 text-center text-xs font-bold text-[#078c9d]">{appointment.time}</div>
                <div>
                  <p className="text-sm font-bold">{appointment.pet} <span className="font-normal text-slate-500">- {appointment.service}</span></p>
                  <p className="mt-1 text-xs text-slate-500">{appointment.vet}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[#e1e8ee] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold">Appointment status</h2>
              <p className="mt-1 text-xs text-slate-500">Current appointment distribution by status</p>
            </div>
            <Activity size={19} className="text-[#078c9d]" />
          </div>
          <div className="mt-6 space-y-5">
            {appointmentStatuses.map(({ label, color }) => (
              <div key={label}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-semibold">{label}</span>
                  <span className="font-bold text-slate-600">{loading ? "..." : error ? "--" : statusCounts[label] ?? 0}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: `${totalStatuses ? ((statusCounts[label] ?? 0) / totalStatuses) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <p className="pb-4 text-xs text-slate-400">RaphaCare clinic administration dashboard.</p>
      </main>
    </div>
  );
}
