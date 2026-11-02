import { useState, useEffect } from 'react';
import { Doughnut, Bar } from "react-chartjs-2";
import api from "../../api/axios";
import StatsCard from "./StatsCard";
import { formatPercentChange, getPreviousDateRange, hasSelectedDateRange, toApiDate } from './reportComparison';

const PetsReport = ({ dateRange }) => {
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
        setData(currentResponse.data.data.pets);
        setPreviousData(previousResponse?.data?.success ? previousResponse.data.data.pets : null);
      }
    } catch (err) {
      console.error('Error fetching pets data:', err);
      setError('Failed to load pets data');
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
          Pets Analytics
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
          Pets Analytics
        </h2>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-red-600 dark:text-red-400">
          {error || 'No data available'}
        </div>
      </section>
    );
  }

  // Get counts by species
  const dogCount = data.bySpecies?.find(s => s.species === 'Dog')?.count || 0;
  const catCount = data.bySpecies?.find(s => s.species === 'Cat')?.count || 0;
  const previousDogCount = previousData?.bySpecies?.find(s => s.species === 'Dog')?.count || 0;
  const previousCatCount = previousData?.bySpecies?.find(s => s.species === 'Cat')?.count || 0;
  const totalPets = data.kpi?.total || 0;

  // Calculate percentages for doughnut chart
  const dogPercentage = totalPets > 0 ? Math.round((dogCount / totalPets) * 100) : 0;
  const catPercentage = totalPets > 0 ? Math.round((catCount / totalPets) * 100) : 0;

  // Prepare pet types data for doughnut chart
  const petTypesData = {
    labels: ["Dogs", "Cats"],
    datasets: [
      { 
        data: [dogPercentage, catPercentage],
        backgroundColor: ['#3b82f6', '#8b5cf6'],
        borderWidth: 0
      }
    ]
  };

  // Prepare monthly registrations data from registrationTrend
  const monthlyRegistrationsData = {
    labels: data.registrationTrend?.map(item => item.month) || 
            ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"],
    datasets: [
      { 
        data: data.registrationTrend?.map(item => item.count) || [],
        backgroundColor: '#8b5cf6',
        borderRadius: 6
      }
    ]
  };

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
        Pets Analytics
      </h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Total Pets" 
          value={formatNumber(totalPets)} 
          change={hasSelectedDateRange(dateRange)
            ? formatPercentChange(data.kpi?.new || 0, previousData?.kpi?.new || 0, dateRange)
            : `+${Math.round((data.kpi?.new || 0) / (totalPets || 1) * 100)}%`} 
        />
        <StatsCard 
          title="Dogs" 
          value={formatNumber(dogCount)} 
          change={hasSelectedDateRange(dateRange)
            ? formatPercentChange(dogCount, previousDogCount, dateRange)
            : `${dogPercentage}%`} 
        />
        <StatsCard 
          title="Cats" 
          value={formatNumber(catCount)} 
          change={hasSelectedDateRange(dateRange)
            ? formatPercentChange(catCount, previousCatCount, dateRange)
            : `${catPercentage}%`} 
        />
        <StatsCard 
          title="New Registered" 
          value={formatNumber(data.kpi?.new || 0)} 
          change={hasSelectedDateRange(dateRange)
            ? formatPercentChange(data.kpi?.new || 0, previousData?.kpi?.new || 0, dateRange)
            : `+${Math.round((data.kpi?.new || 0) / (totalPets || 1) * 100)}%`} 
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#111] p-5 rounded-xl">
          <h3 className="font-semibold mb-4">Pet Types</h3>
          <Doughnut
            data={petTypesData}
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
          <h3 className="font-semibold mb-4">Monthly Registrations</h3>
          <div className="h-[260px]">
            <Bar
              data={monthlyRegistrationsData}
              options={{ 
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (context) => `${context.parsed.y} new pets`
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

export default PetsReport;