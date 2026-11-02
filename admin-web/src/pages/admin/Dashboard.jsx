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
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "../../api/axios";
import ErrorToast from "../../components/admin/template/ErrorToast.jsx";
import socket from "../../socket";

const Dashboard = () => {
  const navigate = useNavigate();
  const [errorToast, setErrorToast] = useState(null);
  const [stats, setStats] = useState({
    adminName: "Admin",
    totalOwners: 0,
    totalPets: 0,
    totalUpComingAppointments: 0,
    totalMissingPets: 0,
  });
  const [appointmentsData, setAppointmentsData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, graphRes, activityRes] = await Promise.all([
        api.get('/admin/dashboard/stats'),
        api.get('/admin/dashboard/appointments-graph'),
        api.get('/admin/dashboard/recent-activities')
      ]);

      setStats(statsRes.data);
      setAppointmentsData(graphRes.data);
      setRecentActivity(activityRes.data);
    } catch (err) {
      console.error("❌ Failed to fetch dashboard data:", err);
      setErrorToast("Failed to load dashboard data. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
      </main>
    </div>
  );
};

export default Dashboard;