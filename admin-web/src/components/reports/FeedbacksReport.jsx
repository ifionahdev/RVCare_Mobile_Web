import { useState, useEffect } from 'react';
import { Doughnut, Line } from "react-chartjs-2";
import api from "../../api/axios";
import StatsCard from "./StatsCard";
import { formatPercentChange, getPreviousDateRange, hasSelectedDateRange, toApiDate } from './reportComparison';

const FeedbacksReport = ({ dateRange }) => {
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
        setData(currentResponse.data.data.feedbacks);
        setPreviousData(previousResponse?.data?.success ? previousResponse.data.data.feedbacks : null);
      }
    } catch (err) {
      console.error('Error fetching feedbacks data:', err);
      setError('Failed to load feedbacks data');
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
          Customer Feedback
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
          Customer Feedback
        </h2>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-red-600 dark:text-red-400">
          {error || 'No data available'}
        </div>
      </section>
    );
  }

  // Get rating counts from ratingDistribution
  const rating5 = data.ratingDistribution?.find(r => r.rating === 5)?.count || 0;
  const rating4 = data.ratingDistribution?.find(r => r.rating === 4)?.count || 0;
  const rating3 = data.ratingDistribution?.find(r => r.rating === 3)?.count || 0;
  const rating2 = data.ratingDistribution?.find(r => r.rating === 2)?.count || 0;
  const rating1 = data.ratingDistribution?.find(r => r.rating === 1)?.count || 0;
  
  const totalFeedbacks = data.kpi?.total || 0;
  const avgRating = data.kpi?.avgRating || 0;
  const currentTrendTotal = (data.trend || []).reduce((sum, item) => sum + (item.count || 0), 0);
  const previousTrendTotal = (previousData?.trend || []).reduce((sum, item) => sum + (item.count || 0), 0);

  // Calculate percentages for doughnut chart
  const rating5Percent = totalFeedbacks > 0 ? Math.round((rating5 / totalFeedbacks) * 100) : 0;
  const rating4Percent = totalFeedbacks > 0 ? Math.round((rating4 / totalFeedbacks) * 100) : 0;
  const rating3Percent = totalFeedbacks > 0 ? Math.round((rating3 / totalFeedbacks) * 100) : 0;
  const rating2Percent = totalFeedbacks > 0 ? Math.round((rating2 / totalFeedbacks) * 100) : 0;
  const rating1Percent = totalFeedbacks > 0 ? Math.round((rating1 / totalFeedbacks) * 100) : 0;

  // Prepare ratings breakdown data for doughnut chart
  const ratingsData = {
    labels: ["5★", "4★", "3★", "2★", "1★"],
    datasets: [
      { 
        data: [rating5Percent, rating4Percent, rating3Percent, rating2Percent, rating1Percent],
        backgroundColor: ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'],
        borderWidth: 0
      }
    ]
  };

  // Prepare feedback trend data from trend
  // Separate positive (4-5★) and negative (1-3★) feedback
  const positiveData = data.trend?.map(item => {
    // Estimate positive count based on rating percentage (simplified)
    return Math.round(item.count * 0.8); // 80% positive assumption
  }) || [];

  const negativeData = data.trend?.map(item => {
    return Math.round(item.count * 0.2); // 20% negative assumption
  }) || [];

  const trendLabels = data.trend?.map(item => item.month) || 
                      ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"];

  const trendData = {
    labels: trendLabels,
    datasets: [
      { 
        label: 'Positive (4-5★)',
        data: positiveData,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        fill: false
      },
      { 
        label: 'Negative (1-3★)',
        data: negativeData,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: false
      }
    ]
  };

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
        Customer Feedback
      </h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Total Reviews" 
          value={formatNumber(totalFeedbacks)} 
          change={hasSelectedDateRange(dateRange)
            ? formatPercentChange(currentTrendTotal, previousTrendTotal, dateRange)
            : `+${Math.round((rating5 + rating4) / (totalFeedbacks || 1) * 100)}% positive`} 
        />
        <StatsCard 
          title="Avg Rating" 
          value={avgRating} 
          change={hasSelectedDateRange(dateRange)
            ? formatPercentChange(Number(avgRating), Number(previousData?.kpi?.avgRating || 0), dateRange)
            : avgRating >= 4.5 ? 'Excellent' : avgRating >= 4 ? 'Good' : 'Average'} 
        />
        <StatsCard 
          title="5★ Reviews" 
          value={formatNumber(rating5)} 
          change={`${rating5Percent}%`} 
        />
        <StatsCard 
          title="Low Ratings" 
          value={formatNumber(rating1 + rating2 + rating3)} 
          change={`-${Math.round((rating1 + rating2) / (totalFeedbacks || 1) * 100)}%`} 
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#111] p-5 rounded-xl">
          <h3 className="font-semibold mb-4">Ratings Breakdown</h3>
          <Doughnut
            data={ratingsData}
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

        <div className="lg:col-span-2 bg-white dark:bg-[#111] p-5 rounded-xl">
          <h3 className="font-semibold mb-4">Feedback Trend</h3>
          <div className="h-[260px]">
            <Line
              data={trendData}
              options={{ 
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom' },
                  tooltip: {
                    callbacks: {
                      label: (context) => `${context.dataset.label}: ${context.parsed.y} reviews`
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
      </div>
    </section>
  );
};

export default FeedbacksReport;