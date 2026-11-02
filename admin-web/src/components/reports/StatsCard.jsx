const StatsCard = ({ title, value, change }) => {
  // Determine change color based on content
  const getChangeColor = () => {
    const numericValue = Number(String(value ?? '').replace(/,/g, ''));

    if (title?.toLowerCase().includes('cancelled') && numericValue === 0) {
      return 'text-green-500';
    }

    if (!change) return 'text-gray-500';
    if (change.includes('+') || change.includes('High') || change.includes('Good') || change.includes('↗')) {
      return 'text-green-500';
    }
    if (change.includes('-') || change.includes('Low')) {
      return 'text-red-500';
    }
    return 'text-gray-500';
  };

  return (
    <div className="bg-white dark:bg-[#111] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 print:shadow-none print:border-gray-200">
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <h2 className="text-2xl font-semibold mt-1 text-gray-800 dark:text-gray-200">
        {value}
      </h2>
      <span className={`text-xs ${getChangeColor()}`}>{change}</span>
    </div>
  );
};

export default StatsCard;