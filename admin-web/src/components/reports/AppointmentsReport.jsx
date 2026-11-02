import { useState, useEffect } from 'react';
import { Line, Doughnut, Bar } from "react-chartjs-2";
import api from "../../api/axios";
import StatsCard from "./StatsCard";
import { formatPercentChange, getPreviousDateRange, hasSelectedDateRange, toApiDate } from './reportComparison';

const AppointmentsReport = ({ dateRange }) => {
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
        setData(currentResponse.data.data.appointments);
        setPreviousData(previousResponse?.data?.success ? previousResponse.data.data.appointments : null);
      }
    } catch (err) {
      console.error('Error fetching appointments data:', err);
      setError('Failed to load appointments data');
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
          Appointments Analytics
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
          Appointments Analytics
        </h2>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-red-600 dark:text-red-400">
          {error || 'No data available'}
        </div>
      </section>
    );
  }

  // Prepare chart data
  const weeklyTrendData = {
    labels: data.weeklyTrend?.map(item => item.day.substring(0, 3)) || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      { 
        data: data.weeklyTrend?.map(item => item.count) || [12, 19, 14, 22, 18, 25, 30],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const statusBreakdownData = {
    labels: ["Completed", "Upcoming", "Pending", "Cancelled"],
    datasets: [
      { 
        data: [
          data.statusBreakdown?.find(s => s.statusName === 'Completed')?.count || 0,
          data.statusBreakdown?.find(s => s.statusName === 'Upcoming')?.count || 0,
          data.statusBreakdown?.find(s => s.statusName === 'Pending')?.count || 0,
          data.statusBreakdown?.find(s => s.statusName === 'Cancelled')?.count || 0
        ],
        backgroundColor: ['#22c55e', '#3b82f6', '#eab308', '#ef4444'],
        borderWidth: 0
      }
    ]
  };

  const peakHoursData = {
    labels: data.peakHours?.map(item => {
      const hour = parseInt(item.hour.split(':')[0]);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}${ampm}`;
    }) || ["8AM", "10AM", "12PM", "2PM", "4PM"],
    datasets: [
      { 
        data: data.peakHours?.map(item => item.count) || [5, 12, 18, 9, 7],
        backgroundColor: '#3b82f6',
        borderRadius: 6
      }
    ]
  };

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
        Appointments Analytics
      </h2>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Total Appointments" 
          value={formatNumber(data.kpi?.total || 0)} 
          change={hasSelectedDateRange(dateRange)
            ? formatPercentChange(data.kpi?.total || 0, previousData?.kpi?.total || 0, dateRange)
            : `${data.kpi?.completionRate || 0}% completion`} 
        />
        <StatsCard 
          title="Completion Rate" 
          value={`${data.kpi?.completionRate || 0}%`} 
          change={hasSelectedDateRange(dateRange)
            ? formatPercentChange(data.kpi?.completionRate || 0, previousData?.kpi?.completionRate || 0, dateRange)
            : data.kpi?.completionRate > 70 ? 'High' : 'Medium'} 
        />
        <StatsCard 
          title="Cancelled" 
          value={formatNumber(data.kpi?.cancelled || 0)} 
          change={hasSelectedDateRange(dateRange)
            ? formatPercentChange(data.kpi?.cancelled || 0, previousData?.kpi?.cancelled || 0, dateRange)
            : data.kpi?.cancelled === 0
              ? '0%'
              : `-${Math.round((data.kpi?.cancelled / (data.kpi?.total || 1)) * 100)}%`} 
        />
        <StatsCard 
          title="Today" 
          value={formatNumber(data.kpi?.today || 0)} 
          change={data.kpi?.today > 0 ? 'Active' : 'No Appointments'} 
        />
      </div>

      {/* CHARTS */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-[#111] p-5 rounded-xl">
          <h3 className="font-semibold mb-4">Weekly Trend</h3>
          <div className="h-[260px]">
            {weeklyTrendData.datasets[0].data.length > 0 ? (
              <Line data={weeklyTrendData} options={{ 
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
              }} />
            ) : (
              <div className="flex items-center justify-center h-full">No data</div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#111] p-5 rounded-xl">
          <h3 className="font-semibold mb-4">Status Breakdown</h3>
          <Doughnut 
            data={statusBreakdownData}
            options={{
              plugins: { legend: { position: 'bottom' } }
            }}
          />
        </div>

        <div className="lg:col-span-3 bg-white dark:bg-[#111] p-5 rounded-xl">
          <h3 className="font-semibold mb-4">Peak Hours</h3>
          <div className="h-[260px]">
            <Bar
              data={peakHoursData}
              options={{ 
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppointmentsReport;