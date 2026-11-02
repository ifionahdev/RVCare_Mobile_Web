import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/admin/template/Header";
import {
  PlusCircle,
  CalendarPlus,
  Cpu,
  MessageSquarePlus,
  ClipboardPlus,
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
  const [todayAppointments, setTodayAppointments] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    let active = true;

    const loadKpis = async () => {
      try {
        const [customers, pets, pending, today, statuses, todayAppointmentsResponse] = await Promise.all([
          api.get("/customers/count"),
          api.get("/pets/count"),
          api.get("/appointments/count/pending"),
          api.get("/appointments/count/today"),
          api.get("/appointments/count/status"),
          api.get("/appointments/today/upcoming"),
        ]);

        if (!active) return;
        setKpis({
          customers: customers.data.count,
          pets: pets.data.count,
          pending: pending.data.count,
          todayPending: today.data.count,
        });
        setStatusCounts(statuses.data);
        setTodayAppointments(todayAppointmentsResponse.data);
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

  useEffect(() => {
    const refreshDashboard = () => fetchDashboardData();

    if (!socket.connected) {
      socket.connect();
    }

    socket.on("appointments_updated", refreshDashboard);
    socket.on("owner_created", refreshDashboard);
    socket.on("pet_created", refreshDashboard);
    socket.on("pets_updated", refreshDashboard);

    return () => {
      socket.off("appointments_updated", refreshDashboard);
      socket.off("owner_created", refreshDashboard);
      socket.off("pet_created", refreshDashboard);
      socket.off("pets_updated", refreshDashboard);
    };
  }, []);

  const statCards = [
    { 
      title: "Total Pet Owners", 
      value: loading ? "..." : stats.totalOwners, 
      color: "from-[#E0F7FA] to-[#E5FBFF]" 
    },
    { 
      title: "Total Pets", 
      value: loading ? "..." : stats.totalPets, 
      color: "from-[#E8F5E9] to-[#F1FBF1]" 
    },
    { 
      title: "Upcoming Appointments", 
      value: loading ? "..." : stats.totalUpComingAppointments, 
      color: "from-[#FFF8E1] to-[#FFFBEA]" 
    },
    { 
      title: "Missing Pets", 
      value: loading ? "..." : stats.totalMissingPets, 
      color: "from-[#FCE4EC] to-[#FFF0F5]" 
    },
  ];

  return (
    <div className="flex bg-[#FBFBFB] dark:bg-[#101010] h-screen overflow-hidden">
      {errorToast && <ErrorToast message={errorToast} onClose={() => setErrorToast(null)} />}
      <main className="flex-1 p-4 flex flex-col justify-between">
        <Header title="Dashboard" />

        {/* ========== WELCOME SECTION ========== */}
        <div className="bg-gradient-to-r from-[#E5FBFF] to-[#FDFBFF] dark:from-[#1F1F1F] dark:to-[#232323] rounded-2xl p-4 mb-3 flex justify-between items-center shadow-sm border border-gray-100 dark:border-gray-800">
          <div>
            <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Welcome back, {stats.adminName} 👋
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Here's what's happening in RVCare today.
            </p>
          </div>
        </div>

        {/* ========== MAIN GRID ========== */}
        <div className="grid grid-rows-[auto_auto_1fr] gap-3 flex-1 overflow-hidden">
          {/* Stat Cards */}
          <div className="grid grid-cols-4 gap-4">
            {statCards.map((card, i) => (
              <div
                key={i}
                className={`bg-gradient-to-br ${card.color} dark:from-[#1B1B1B] dark:to-[#222] rounded-2xl shadow-md border border-white/40 dark:border-gray-800 p-4 hover:scale-[1.02] transition-transform`}
              >
                <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                  {card.title}
                </p>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-1">
                  {card.value}
                </h2>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
              {[
                {
                  title: "Add Pet",
                  icon: <PlusCircle size={18} />,
                  color: "from-[#D6F6FF] to-[#E5FBFF]",
                  onClick: () => navigate("/admin-pages/pet-management"),
                },
                {
                  title: "Add Appointment",
                  icon: <CalendarPlus size={18} />,
                  color: "from-[#E0F8D8] to-[#EAFCE3]",
                  onClick: () => navigate("/admin-pages/appointments/add"),
                },
                {
                  title: "Add Visit",
                  icon: <ClipboardPlus size={18} />,
                  color: "from-[#E8F2FF] to-[#F3F8FF]",
                  onClick: () => navigate("/admin-pages/visits/add"),
                },
                {
                  title: "Post Tip",
                  icon: <MessageSquarePlus size={18} />,
                  color: "from-[#FFF0D2] to-[#FFF9E5]",
                  onClick: () => navigate("/admin-pages/content-manager"),
                },
                {
                  title: "Reports",
                  icon: <Cpu size={18} />,
                  color: "from-[#FFDDEE] to-[#FFE6F5]",
                  onClick: () => navigate("/admin-pages/reports"),
                },
              ].map((action, i) => (
                <div
                  key={i}
                  onClick={action.onClick}
                  className={`bg-gradient-to-br ${action.color} dark:from-[#1B1B1B] dark:to-[#222] 
                    rounded-xl p-3 flex items-center justify-center gap-2 text-gray-700 dark:text-gray-200 
                    cursor-pointer hover:brightness-105 hover:scale-101 transition duration-200`}
                >
                  {action.icon}
                  <span className="text-xs font-semibold">{action.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart + Activity */}
          <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
            {/* Chart */}
            <div className="col-span-2 bg-white dark:bg-[#181818] rounded-2xl shadow-md border border-gray-100 dark:border-gray-800 p-4 flex flex-col">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Appointments Over Time
              </h3>
              <div className="h-52"> 
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={appointmentsData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                    <defs>
                      <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#5EE6FE" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#5EE6FE" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="5 5" stroke="#E5E7EB" className="dark:stroke-gray-700" />
                    <XAxis dataKey="month" stroke="#9CA3AF" fontSize={10} />
                    <YAxis stroke="#9CA3AF" fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255,255,255,0.9)",
                        borderRadius: "10px",
                        border: "1px solid #E5E7EB",
                        fontSize: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="appointments"
                      stroke="#5EE6FE"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      fill="url(#lineGradient)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="col-span-1 flex flex-col min-h-0">
              <div className="bg-white dark:bg-[#181818] rounded-2xl shadow-md border border-gray-100 dark:border-gray-800 p-4 flex flex-col flex-1 min-h-0">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Recent Activity
                </h3>

                {/* Scrollable vertical area */}
                <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-[#5EE6FE]/40 scrollbar-track-transparent">
                  <ul className="space-y-2">
                    {recentActivity.length > 0 ? (
                      recentActivity.map((activity, i) => (
                        <li
                          key={i}
                          className="p-3 rounded-xl bg-gradient-to-r from-[#F0F9FF] to-[#E5FBFF] dark:from-[#1B1B1B] dark:to-[#222] 
                                    flex items-center justify-between gap-2 text-gray-800 dark:text-gray-200 
                                    border border-gray-100 dark:border-gray-800 hover:translate-x-0.5 hover:brightness-105 transition-all duration-200"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-[#5EE6FE] dark:bg-[#3BAFDA]" />
                            <div className="flex flex-col">
                              <p className="font-medium text-sm">{activity.action}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{activity.time}</p>
                            </div>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="text-center text-gray-500 text-sm py-4">
                        No recent activities
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        {kpiError && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{kpiError}</p>}
        <section className="rounded-2xl border border-[#e1e8ee] bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h3 className="text-base font-extrabold">Upcoming schedule</h3><p className="mt-1 text-xs text-slate-500">Today's upcoming appointments</p></div><CalendarDays size={19} className="text-[#078c9d]" /></div>
          <div className="mt-5 space-y-4">{kpiLoading ? <p className="text-sm text-slate-500">Loading today's schedule...</p> : todayAppointments.length === 0 ? <p className="text-sm text-slate-500">No upcoming appointments today.</p> : todayAppointments.map((appointment) => <div key={appointment.id} className="flex gap-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0"><div className="min-w-[78px] rounded-lg bg-[#eaf6f8] px-2 py-2 text-center text-xs font-bold text-[#078c9d]">{appointment.timeslot}</div><div><p className="text-sm font-bold">{appointment.petName} <span className="font-normal text-slate-500">· {appointment.service}</span></p><p className="mt-1 text-xs text-slate-500">{appointment.vetName}</p></div></div>)}</div>
        </section>
        <section className="overflow-hidden rounded-2xl border border-[#e1e8ee] bg-white shadow-sm"><div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center"><div><h3 className="text-base font-extrabold">Recent appointment requests</h3><p className="mt-1 text-xs text-slate-500">Preview of the clinic's appointment list</p></div></div>
          <div className="px-5 py-10 text-center text-sm text-slate-500">Appointment list integration is not connected yet.</div>
        </section>
        <section className="rounded-2xl border border-[#e1e8ee] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-base font-extrabold">Appointment status</h3><p className="mt-1 text-xs text-slate-500">Current appointment distribution by status</p></div><Activity size={19} className="text-[#078c9d]" /></div>
          <div className="mt-6 space-y-5">{appointmentStatuses.map(({ label, color }) => <div key={label}><div className="mb-2 flex justify-between text-sm"><span className="font-semibold">{label}</span><span className="font-bold text-slate-600">{kpiLoading ? "..." : kpiError ? "—" : statusCounts[label] ?? 0}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${(statusCounts[label] ?? 0) / Math.max(1, Object.values(statusCounts).reduce((sum, count) => sum + count, 0)) * 100}%` }} /></div></div>)}</div>
          <p className="mt-5 text-xs text-slate-400">Live appointment status counts.</p>
        </section>
        <p className="pb-4 text-xs text-slate-400">RaphaCare admin dashboard preview · Light mode · Sample data only · No real appointments are changed.</p>
      </main>
    </div>
  );
};

export default Dashboard;