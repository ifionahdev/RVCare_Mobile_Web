import { useEffect, useState } from "react";
import { Line, Bar } from "react-chartjs-2";
import StatsCard from "./StatsCard";
import api from "../../api/axios";
import { formatPercentChange, getPreviousDateRange, hasSelectedDateRange, toApiDate } from './reportComparison';

const VisitsReport = ({ dateRange }) => {
  const [visitsData, setVisitsData] = useState(null);
  const [previousData, setPreviousData] = useState(null);

  useEffect(() => {
    const fetchVisitsData = async () => {
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

        if (currentResponse.data?.success) {
          setVisitsData(currentResponse.data.data?.visits || null);
          setPreviousData(previousResponse?.data?.success ? previousResponse.data.data?.visits || null : null);
        }
      } catch (error) {
        console.error("Error fetching visits report data:", error);
      }
    };

    fetchVisitsData();
  }, [dateRange]);

  const formatNumber = (num) =>
    num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") || "0";

  const totalVisits = visitsData?.kpi?.total;

  const weekdayLabels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const weekdayShortLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const trendLabels = weekdayShortLabels;
  const trendValues = weekdayLabels.map((day) => {
    const match = visitsData?.dailyTrend?.find((item) => item.day === day);
    return match ? match.count : 0;
  });

  const serviceLabels = visitsData?.topServices?.map((item) => item.service) || ["Consultation", "Vaccination", "Grooming", "Surgery"];
  const serviceValues = visitsData?.topServices?.map((item) => item.count) || [220, 300, 180, 90];

  const rangeTotal = trendValues.reduce((sum, val) => sum + (val || 0), 0);
  const totalChangePercent = totalVisits > 0 ? Math.round((rangeTotal / totalVisits) * 100) : 0;
  const previousRangeTotal = (previousData?.dailyTrend || []).reduce((sum, item) => sum + (item.count || 0), 0);

  const avgPerDay = visitsData?.insights?.dailyAverage || 0;
  const todayVisits = visitsData?.insights?.today || 0;
  const todayVsAvgPercent = avgPerDay > 0 ? Math.round(((todayVisits - avgPerDay) / avgPerDay) * 100) : 0;
  const todayChangeLabel = avgPerDay > 0
    ? `${todayVsAvgPercent >= 0 ? '+' : ''}${todayVsAvgPercent}% vs avg`
    : 'No baseline';

  const yesterdayVisits = trendValues.length > 1 ? trendValues[trendValues.length - 2] : 0;
  const avgVsYesterdayPercent = yesterdayVisits > 0 ? Math.round(((avgPerDay - yesterdayVisits) / yesterdayVisits) * 100) : 0;
  const avgChangeLabel = yesterdayVisits > 0
    ? `${avgVsYesterdayPercent >= 0 ? '+' : ''}${avgVsYesterdayPercent}% vs yesterday`
    : 'No baseline';

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
        Clinic Visits
      </h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Visits"
          value={formatNumber(totalVisits)}
          change={hasSelectedDateRange(dateRange)
            ? formatPercentChange(rangeTotal, previousRangeTotal, dateRange)
            : `${totalChangePercent}% in range`}
        />
        <StatsCard title="Today" value={formatNumber(todayVisits)} change={todayChangeLabel} />
        <StatsCard title="Peak Day" value={visitsData?.insights?.mostPopularDay || "N/A"} change={formatNumber(visitsData?.insights?.mostPopularDayCount || 0)} />
        <StatsCard title="Avg / Day" value={formatNumber(avgPerDay)} change={avgChangeLabel} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#111] p-5 rounded-xl">
          <h3 className="font-semibold mb-4">Daily Visits Trend</h3>
          <div className="h-[260px]">
            <Line
              data={{
                labels: trendLabels,
                datasets:[
                  { 
                    data: trendValues,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                  }
                ]
              }}
              options={{ 
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false }
                }
              }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-[#111] p-5 rounded-xl">
          <h3 className="font-semibold mb-4">Visits per Service</h3>
          <div className="h-[260px]">
            <Bar
              data={{
                labels: serviceLabels,
                datasets:[
                  { 
                    data: serviceValues,
                    backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316'],
                    borderRadius: 6
                  }
                ]
              }}
              options={{ 
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false }
                }
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default VisitsReport;