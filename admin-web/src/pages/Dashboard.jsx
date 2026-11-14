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
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [customers, pets, pending, today, statuses, upcoming, appointments] = await Promise.all([
        api.get("/customers/count"),
        api.get("/pets/count"),
        api.get("/appointments/count/pending"),
        api.get("/appointments/count/today"),
        api.get("/appointments/count/status"),
        api.get("/appointments/today/upcoming"),
        api.get("/appointments"),
      ]);

      setKpis({
        customers: customers.data.count,
        pets: pets.data.count,
        pending: pending.data.count,
        today: today.data.count,
      });
      setStatusCounts(statuses.data ?? {});
      setUpcomingAppointments(upcoming.data ?? []);
      setRecentAppointments((appointments.data ?? []).slice(0, 6));
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
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {upcomingAppointments.map((appointment) => {
              const veterinarian = appointment.veterinarian?.account;
              const vetName = veterinarian
                ? `Dr. ${veterinarian.firstName} ${veterinarian.lastName}`
                : appointment.vetName ?? "Veterinarian not assigned";

              return (
                <div key={appointment.appointmentId ?? appointment.id} className="flex min-w-0 items-center gap-3 rounded-xl bg-slate-50 p-3">
                  <div className="min-w-[78px] shrink-0 rounded-lg bg-[#eaf6f8] px-2 py-2 text-center text-xs font-bold text-[#078c9d]">
                    {appointment.timeslot?.display ?? appointment.timeslot ?? "--"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">
                      {appointment.pet?.petName ?? appointment.petName ?? "Unknown pet"}
                      <span className="font-normal text-slate-500"> - {appointment.service?.serviceName ?? appointment.service ?? "Service"}</span>
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">{vetName}</p>
                  </div>
                </div>
              );
            })}
            {!loading && !error && upcomingAppointments.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-500 sm:col-span-2 xl:col-span-3">No upcoming appointments today.</p>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#e1e8ee] bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-base font-extrabold">Recent appointment requests</h2>
            <p className="mt-1 text-xs text-slate-500">Latest appointments managed by the clinic</p>
          </div>
          {loading ? (
            <div className="px-5 py-10 text-center text-sm text-slate-500">Loading appointments...</div>
          ) : recentAppointments.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-500">No recent appointments.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Pet</th>
                    <th className="px-5 py-3 font-semibold">Service</th>
                    <th className="px-5 py-3 font-semibold">Veterinarian</th>
                    <th className="px-5 py-3 font-semibold">Schedule</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAppointments.map((appointment) => {
                    const veterinarian = appointment.veterinarian?.account;
                    const owner = appointment.pet?.owner?.account;
                    return (
                      <tr key={appointment.appointmentId} className="border-t border-slate-100 text-slate-700">
                        <td className="px-5 py-4">
                          <p className="font-bold">{appointment.pet?.petName ?? "Unknown pet"}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {[owner?.firstName, owner?.lastName].filter(Boolean).join(" ") || "Unknown owner"}
                          </p>
                        </td>
                        <td className="px-5 py-4">{appointment.service?.serviceName ?? "--"}</td>
                        <td className="px-5 py-4">
                          {[veterinarian?.firstName, veterinarian?.lastName].filter(Boolean).join(" ")
                            ? `Dr. ${[veterinarian?.firstName, veterinarian?.lastName].filter(Boolean).join(" ")}`
                            : "Not assigned"}
                        </td>
                        <td className="px-5 py-4">
                          <p>{appointment.timeslot?.display ?? "--"}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {appointment.scheduledDate
                              ? new Date(appointment.scheduledDate).toLocaleDateString()
                              : "--"}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="rounded-full bg-[#eaf6f8] px-3 py-1 text-xs font-bold text-[#078c9d]">
                            {appointment.status ?? "--"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
