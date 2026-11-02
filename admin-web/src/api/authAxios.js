import axios from "axios";

export const TOKEN_KEY = "raphacare_token";

const authApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 10000,
});

authApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = ["Bearer", token].join(" ");
  }

  return config;
});

export default authApi;
