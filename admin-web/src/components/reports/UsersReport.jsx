import { useState, useEffect } from 'react';
import { Line, Doughnut } from "react-chartjs-2";
import StatsCard from "./StatsCard";
import api from "../../api/axios";
import { formatPercentChange, getPreviousDateRange, hasSelectedDateRange, toApiDate } from './reportComparison';


const UsersReport = ({ dateRange }) => {
  const [data, setData] = useState(null);
  const [previousData, setPreviousData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const currentParams = {};
      const previousRange = getPreviousDateRange(dateRange);
      if (hasSelectedDateRange(dateRange)) {
        currentParams.startDate = toApiDate(dateRange.start);
        currentParams.endDate = toApiDate(dateRange.end);
      }

      const previousParams = previousRange
        ? {
            startDate: toApiDate(previousRange.start),
            endDate: toApiDate(previousRange.end),
          }
        : null;

      const [currentResponse, previousResponse] = await Promise.all([
        api.get('/admin/reports', { params: currentParams }),
        previousParams
          ? api.get('/admin/reports', { params: previousParams })
          : Promise.resolve(null),
      ]);

      if (currentResponse.data.success) {
        setData(currentResponse.data.data.users);
        setPreviousData(previousResponse?.data?.success ? previousResponse.data.data.users : null);
      }
    } catch (err) {
      console.error('Error fetching users data:', err);
      setError('Failed to load users data');
    } finally {
      setLoading(false);
    }
  };

  // Format numbers with commas
  const formatNumber = (num) => {
    return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") || "0";
  };

  if (loading) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
          Users Analytics
        </h2>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
          Users Analytics
        </h2>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-red-600 dark:text-red-400">
          {error || 'No data available'}
        </div>
      </section>
    );
  }

  // Get counts by role
  const clientCount = data.byRole?.find(r => r.roleName === 'Client')?.count || 0;
  const vetCount = data.byRole?.find(r => r.roleName === 'Veterinarian')?.count || 0;
  const adminCount = data.byRole?.find(r => r.roleName === 'Administrator')?.count || 0;

  // Prepare registration trend data (last 6 months)
  const registrationTrendData = {
    labels: data.registrationTrend?.map(item => item.month) || 
            ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      { 
        data: data.registrationTrend?.map(item => item.count) || [],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  // Prepare user roles data
  const userRolesData = {
    labels: ["Clients", "Veterinarians", "Admins"],
    datasets: [
      { 
        data: [clientCount, vetCount, adminCount],
        backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899'],
        borderWidth: 0
      }
    ]
  };

  // Calculate percentages
  const newUserPercentage = data.kpi?.total > 0 
    ? Math.round((data.kpi?.new / data.kpi?.total) * 100) 
    : 0;
  
  const activePercentage = data.kpi?.total > 0 
    ? Math.round((data.kpi?.active / data.kpi?.total) * 100) 
    : 0;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
        Users Analytics
      </h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Total Clients" 
          value={formatNumber(data.kpi?.total || 0)} 
          change={hasSelectedDateRange(dateRange)
            ? formatPercentChange(data.kpi?.new || 0, previousData?.kpi?.new || 0, dateRange)
            : `+${newUserPercentage}%`} 
        />
        <StatsCard 
          title="New This Month" 
          value={formatNumber(data.kpi?.new || 0)} 
          change={hasSelectedDateRange(dateRange)
            ? formatPercentChange(data.kpi?.new || 0, previousData?.kpi?.new || 0, dateRange)
            : `+${newUserPercentage}%`} 
        />
        <StatsCard 
          title="Active Now" 
          value={formatNumber(data.kpi?.active || 0)} 
          change={hasSelectedDateRange(dateRange)
            ? formatPercentChange(data.kpi?.active || 0, previousData?.kpi?.active || 0, dateRange)
            : `${activePercentage}% of clients`} 
        />
        <StatsCard 
          title="Admins" 
          value={formatNumber(adminCount)} 
          change="Stable" 
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-[#111] p-5 rounded-xl">
          <h3 className="font-semibold mb-4">Client Registration Trend</h3>
          <div className="h-[260px]">
            {registrationTrendData.datasets[0].data.length > 0 ? (
              <Line
                data={registrationTrendData}
                options={{ 
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (context) => `${context.parsed.y} new clients`
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: (value) => Math.floor(value)
                      }
                    }
                  }
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No registration data available
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#111] p-5 rounded-xl">
          <h3 className="font-semibold mb-4">User Roles</h3>
          <div className="h-[260px]">
            {userRolesData.datasets[0].data.some(v => v > 0) ? (
              <Doughnut
                data={userRolesData}
                options={{
                  plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const total = context.dataset.data.reduce((a, b) => a + b, 0);
                          const percentage = ((context.parsed / total) * 100).toFixed(1);
                          return `${context.label}: ${context.parsed} (${percentage}%)`;
                        }
                      }
                    }
                  },
                  cutout: '60%'
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No role data available
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default UsersReport;