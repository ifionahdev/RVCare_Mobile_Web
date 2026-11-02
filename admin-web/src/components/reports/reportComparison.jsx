export const toApiDate = (date) => {
  if (!date) return null;
  // Extract date in LOCAL timezone (not UTC) to preserve intended date range
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const hasSelectedDateRange = (dateRange) =>
  Boolean(dateRange?.start && dateRange?.end);

export const getRangeLengthInDays = (dateRange) => {
  if (!hasSelectedDateRange(dateRange)) return 0;

  const start = new Date(dateRange.start);
  const end = new Date(dateRange.end);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diffMs = end.getTime() - start.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

  return Math.max(days, 1);
};

export const getPreviousDateRange = (dateRange) => {
  if (!hasSelectedDateRange(dateRange)) return null;

  const days = getRangeLengthInDays(dateRange);
  const currentStart = new Date(dateRange.start);
  currentStart.setHours(0, 0, 0, 0);

  const previousEnd = new Date(currentStart);
  previousEnd.setDate(previousEnd.getDate() - 1);

  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousStart.getDate() - (days - 1));

  return {
    start: previousStart,
    end: previousEnd,
    days,
  };
};

export const getComparisonLabel = (dateRange) => {
  const days = getRangeLengthInDays(dateRange);

  if (days <= 0) return "";
  if (days === 1) return "vs yesterday";
  if (days === 7) return "vs last 7 days";
  if (days === 30) return "vs last 30 days";

  return `vs previous ${days} days`;
};

export const getPercentChange = (currentValue, previousValue) => {
  const current = Number(currentValue || 0);
  const previous = Number(previousValue || 0);

  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return Math.round(((current - previous) / previous) * 100);
};

export const formatPercentChange = (
  currentValue,
  previousValue,
  dateRange,
  options = {},
) => {
  const { suffix = "" } = options;
  const percent = getPercentChange(currentValue, previousValue);
  const sign = percent > 0 ? '+' : '';

  const suffixText = suffix ? ` ${suffix}` : '';

  return `${sign}${percent}%${suffixText}`.trim();
};
