export const TOKEN_KEY = "raphacare_token";

const mockResponse = (data) => Promise.resolve({ data });

let mockArticles = [
  { id: 1, title: "Keeping Your Pet Healthy", shortDescription: "Simple habits for a healthier pet.", detailedContent: "Regular exercise, balanced meals, grooming, and routine veterinary visits help keep pets healthy.", category: "Health", status: "Published", pubStatusID: 2 },
  { id: 2, title: "Preparing for Your First Vet Visit", shortDescription: "What to bring and what to expect.", detailedContent: "Bring vaccination records, a list of questions, and your pet's favorite comfort item.", category: "Care", status: "Draft", pubStatusID: 1 },
];

let mockVideos = [
  { id: 1, title: "Basic Pet Grooming", videoTitle: "Basic Pet Grooming", videoURL: "https://www.youtube.com/watch?v=demo", category: "Grooming", status: "Published", pubStatusID: 2 },
];

const mockCategories = [
  { id: 1, name: "Health" },
  { id: 2, name: "Care" },
  { id: 3, name: "Nutrition" },
];

const mockVideoCategories = [
  { id: 1, name: "Grooming", videoCategory: "Grooming" },
  { id: 2, name: "Training", videoCategory: "Training" },
];

const mockStatuses = [
  { id: 1, name: "Draft", description: "Visible only to administrators" },
  { id: 2, name: "Published", description: "Visible to users" },
  { id: 3, name: "Archived", description: "No longer active" },
];

const mockApi = {
  get(url) {
    if (url === "/admin/content/videos/videos/") return mockResponse({ data: mockVideos });
    if (url === "/admin/content/videos/categories") return mockResponse({ data: mockVideoCategories });
    if (url === "/admin/content/pet-care-tips") return mockResponse({ data: mockArticles });
    if (url === "/admin/content/pet-care-categories") return mockResponse({ data: mockCategories });
    if (url === "/admin/content/pet-care-tips/icons") return mockResponse({ data: [{ id: 1, iconName: "PawPrint", iconURL: "" }] });
    if (url === "/admin/content/publication-statuses") return mockResponse({ data: mockStatuses });
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
  post(url, body = {}) {
    if (url === "/admin/content/pet-care-tips/createPetCare") {
      const category = mockCategories.find((item) => item.id === Number(body.petCareCategoryID));
      mockArticles.push({ id: Math.max(0, ...mockArticles.map((item) => item.id)) + 1, ...body, category: category?.name || "General", status: mockStatuses.find((item) => item.id === Number(body.pubStatusID))?.name || "Draft" });
      return mockResponse({ success: true, message: "Article saved successfully" });
    }
    if (url === "/admin/content/videos/create") {
      const category = mockVideoCategories.find((item) => item.id === Number(body.videoCategoryID));
      mockVideos.push({ id: Math.max(0, ...mockVideos.map((item) => item.id)) + 1, ...body, title: body.videoTitle, category: category?.name || category?.videoCategory || "General", status: mockStatuses.find((item) => item.id === Number(body.pubStatusID))?.name || "Draft" });
      return mockResponse({ success: true, message: "Video saved successfully" });
    }
    return mockResponse({ success: true, message: "Saved successfully" });
  },
  put(url, body = {}) {
    const articleMatch = url.match(/pet-care-tips\/updatePetCare\/(\d+)/);
    if (articleMatch) {
      const id = Number(articleMatch[1]);
      const category = mockCategories.find((item) => item.id === Number(body.petCareCategoryID));
      mockArticles = mockArticles.map((item) => item.id === id ? { ...item, ...body, category: category?.name || item.category, status: mockStatuses.find((status) => status.id === Number(body.pubStatusID))?.name || item.status } : item);
      return mockResponse({ success: true, message: "Article updated successfully" });
    }
    const videoMatch = url.match(/videos\/update\/(\d+)/);
    if (videoMatch) {
      const id = Number(videoMatch[1]);
      const category = mockVideoCategories.find((item) => item.id === Number(body.videoCategoryID));
      mockVideos = mockVideos.map((item) => item.id === id ? { ...item, ...body, title: body.videoTitle, category: category?.name || item.category, status: mockStatuses.find((status) => status.id === Number(body.pubStatusID))?.name || item.status } : item);
      return mockResponse({ success: true, message: "Video updated successfully" });
    }
    return mockResponse({ success: true, message: "Updated successfully" });
  },
  patch: () => mockResponse({ success: true, message: "Updated successfully" }),
  delete(url) {
    const articleMatch = url.match(/pet-care-tips\/deletePetCare\/(\d+)/);
    if (articleMatch) {
      mockArticles = mockArticles.filter((item) => item.id !== Number(articleMatch[1]));
      return mockResponse({ success: true, message: "Article deleted successfully" });
    }
    const videoMatch = url.match(/videos\/delete\/(\d+)/);
    if (videoMatch) {
      mockVideos = mockVideos.filter((item) => item.id !== Number(videoMatch[1]));
      return mockResponse({ success: true, message: "Video deleted successfully" });
    }
    return mockResponse({ success: true, message: "Deleted successfully" });
  },
};

export default mockApi;
