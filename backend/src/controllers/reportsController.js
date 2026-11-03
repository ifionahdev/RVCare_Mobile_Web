const weekDays = [
  ["Monday", 18],
  ["Tuesday", 24],
  ["Wednesday", 21],
  ["Thursday", 28],
  ["Friday", 26],
  ["Saturday", 32],
  ["Sunday", 19],
];

const buildReportsMock = () => ({
  appointments: {
    kpi: {
      total: 168,
      completionRate: 82,
      cancelled: 14,
      today: 12,
    },
    weeklyTrend: weekDays.map(([day, count]) => ({ day, count })),
    statusBreakdown: [
      { statusName: "Completed", count: 138 },
      { statusName: "Upcoming", count: 16 },
      { statusName: "Pending", count: 10 },
      { statusName: "Cancelled", count: 14 },
    ],
    peakHours: [
      { hour: "08:00", count: 8 },
      { hour: "09:00", count: 16 },
      { hour: "10:00", count: 24 },
      { hour: "11:00", count: 19 },
      { hour: "14:00", count: 22 },
      { hour: "15:00", count: 17 },
    ],
  },
  users: {
    kpi: { total: 1248, new: 84, active: 376 },
    byRole: [
      { roleName: "Client", count: 1184 },
      { roleName: "Veterinarian", count: 48 },
      { roleName: "Administrator", count: 16 },
    ],
    registrationTrend: [
      { month: "Jun", count: 58 },
      { month: "Jul", count: 66 },
      { month: "Aug", count: 71 },
      { month: "Sep", count: 78 },
      { month: "Oct", count: 82 },
      { month: "Nov", count: 84 },
    ],
  },
  pets: {
    kpi: { total: 892, new: 63 },
    bySpecies: [
      { species: "Dog", count: 541 },
      { species: "Cat", count: 351 },
    ],
    registrationTrend: [
      { month: "Jun", count: 38 },
      { month: "Jul", count: 45 },
      { month: "Aug", count: 52 },
      { month: "Sep", count: 48 },
      { month: "Oct", count: 59 },
      { month: "Nov", count: 63 },
    ],
  },
  visits: {
    kpi: { total: 790 },
    dailyTrend: weekDays.map(([day, count]) => ({ day, count })),
    topServices: [
      { service: "Consultation", count: 286 },
      { service: "Vaccination", count: 214 },
      { service: "Grooming", count: 168 },
      { service: "Surgery", count: 122 },
    ],
    insights: {
      dailyAverage: 113,
      today: 128,
      mostPopularDay: "Saturday",
      mostPopularDayCount: 32,
    },
  },
  feedbacks: {
    kpi: { total: 486, avgRating: 4.6 },
    ratingDistribution: [
      { rating: 5, count: 278 },
      { rating: 4, count: 146 },
      { rating: 3, count: 38 },
      { rating: 2, count: 16 },
      { rating: 1, count: 8 },
    ],
    trend: [
      { month: "Jun", count: 64 },
      { month: "Jul", count: 72 },
      { month: "Aug", count: 78 },
      { month: "Sep", count: 83 },
      { month: "Oct", count: 91 },
      { month: "Nov", count: 98 },
    ],
  },
  lostPets: {
    kpi: { total: 42, lost: 16, found: 26, successRate: 62 },
    monthlyTrend: [
      { month: "June", total: 5 },
      { month: "July", total: 7 },
      { month: "August", total: 8 },
      { month: "September", total: 6 },
      { month: "October", total: 9 },
      { month: "November", total: 7 },
    ],
  },
});

export const getReports = (req, res) => {
  res.json({
    success: true,
    data: buildReportsMock(),
  });
};

export const exportReportsPdf = (req, res) => {
  res.status(501).json({
    success: false,
    message: "PDF export will be available when report data is connected.",
  });
};
