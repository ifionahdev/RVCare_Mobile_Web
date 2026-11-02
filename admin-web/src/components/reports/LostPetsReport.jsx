import { useState, useEffect } from 'react';
import { Line, Doughnut } from "react-chartjs-2";
import api from "../../api/axios";
import StatsCard from "./StatsCard";
import { formatPercentChange, getPreviousDateRange, hasSelectedDateRange, toApiDate } from './reportComparison';

const LostPetsReport = ({ dateRange }) => {
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
        setData(currentResponse.data.data.lostPets);
        setPreviousData(previousResponse?.data?.success ? previousResponse.data.data.lostPets : null);
      }
    } catch (err) {
      console.error('Error fetching lost pets data:', err);
      setError('Failed to load lost pets data');
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
          Lost Pets Tracking
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
          Lost Pets Tracking
        </h2>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-red-600 dark:text-red-400">
          {error || 'No data available'}
        </div>
      </section>
    );
  }

  // Get counts from data
  const totalReports = data.kpi?.total || 0;
  const lostCount = data.kpi?.lost || 0;
  const foundCount = data.kpi?.found || 0;
  const successRate = data.kpi?.successRate || 0;
  const activeCases = totalReports - foundCount;
  const previousLost = previousData?.kpi?.lost || 0;
  const previousFound = previousData?.kpi?.found || 0;
  const previousTotalReports = previousLost + previousFound;

  // Calculate percentages for doughnut chart
  const foundPercent = totalReports > 0 ? Math.round((foundCount / totalReports) * 100) : 0;
  const notFoundPercent = totalReports > 0 ? 100 - foundPercent : 0;

  // Prepare monthly trend data
  const monthlyTrendData = {
    labels: data.monthlyTrend?.map(item => item.month.substring(0, 3)) || 
            ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"],
    datasets: [
      { 
        label: 'Reports',
        data: data.monthlyTrend?.map(item => item.total) || [],
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  // Prepare found status data for doughnut chart
  const foundStatusData = {
    labels: ["Found", "Not Yet Found"],
    datasets: [
      { 
        data: [foundPercent, notFoundPercent],
        backgroundColor: ['#22c55e', '#ef4444'],
        borderWidth: 0
      }
    ]
  };

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
        Lost Pets Tracking
      </h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Total Reports" 
          value={formatNumber(totalReports)} 
          change={hasSelectedDateRange(dateRange)
            ? formatPercentChange(totalReports, previousTotalReports, dateRange)
            : `+${Math.round((totalReports - (data.monthlyTrend?.[0]?.total || 0)) / (totalReports || 1) * 100)}%`} 
        />
        <StatsCard 
          title="Found" 
          value={formatNumber(foundCount)} 
          change={hasSelectedDateRange(dateRange)
            ? formatPercentChange(foundCount, previousFound, dateRange)
            : `+${Math.round((foundCount / (totalReports || 1)) * 100)}%`} 
        />
        <StatsCard 
          title="Active Cases" 
          value={formatNumber(activeCases)} 
          change={hasSelectedDateRange(dateRange)
            ? formatPercentChange(activeCases, Math.max(previousTotalReports - previousFound, 0), dateRange)
            : `-${Math.round((activeCases / (totalReports || 1)) * 100)}%`} 
        />
        <StatsCard 
          title="Found Rate" 
          value={`${successRate}%`} 
          change={successRate >= 60 ? 'Good' : successRate >= 40 ? 'Average' : 'Low'} 
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-[#111] p-5 rounded-xl">
          <h3 className="font-semibold mb-4">Reports per Month</h3>
          <div className="h-[260px]">
            <Line
              data={monthlyTrendData}
              options={{ 
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (context) => `${context.parsed.y} reports`
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
          </div>
        </div>

        <div className="bg-white dark:bg-[#111] p-5 rounded-xl">
          <h3 className="font-semibold mb-4">Found Status</h3>
          <Doughnut
            data={foundStatusData}
            options={{
              plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      return `${context.label}: ${context.parsed}%`;
                    }
                  }
                }
              },
              cutout: '60%'
            }}
          />
        </div>
      </div>
    </section>
  );
};

export default LostPetsReport;