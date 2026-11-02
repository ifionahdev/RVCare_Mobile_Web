export const TOKEN_KEY = "raphacare_token";

const mockResponse = (data) => Promise.resolve({ data });

const mockApi = {
  get(url) {
    if (url === "/customers/count") {
      return mockResponse({ count: 128 });
    }

    if (url === "/pets/count") {
      return mockResponse({ count: 246 });
    }

    if (url === "/appointments/count/pending") {
      return mockResponse({ count: 12 });
    }

    if (url === "/appointments/count/today") {
      return mockResponse({ count: 8 });
    }

    if (url === "/appointments/count/status") {
      return mockResponse({
        Pending: 12,
        Upcoming: 18,
        Rejected: 3,
        Completed: 74,
        Missed: 5,
        Cancelled: 7,
      });
    }

    if (url.includes("/dashboard/stats")) {
      return mockResponse({
        adminName: "Admin User",
        totalOwners: 128,
        totalPets: 246,
        totalUpComingAppointments: 18,
        totalMissingPets: 4,
      });
    }

    if (url.includes("appointments-graph")) {
      return mockResponse([
        { month: "Jan", appointments: 18 },
        { month: "Feb", appointments: 24 },
        { month: "Mar", appointments: 21 },
        { month: "Apr", appointments: 32 },
        { month: "May", appointments: 29 },
        { month: "Jun", appointments: 38 },
      ]);
    }

    if (url.includes("recent-activities")) {
      return mockResponse([
        { id: 1, activity: "New appointment booked", time: "10 minutes ago" },
        { id: 2, activity: "Pet record updated", time: "35 minutes ago" },
        { id: 3, activity: "Owner profile added", time: "1 hour ago" },
      ]);
    }

    return mockResponse([]);
  },
  post: () => mockResponse({ success: true, message: "Saved successfully" }),
  put: () => mockResponse({ success: true, message: "Updated successfully" }),
  patch: () => mockResponse({ success: true, message: "Updated successfully" }),
  delete: () => mockResponse({ success: true, message: "Deleted successfully" }),
};

export default mockApi;
