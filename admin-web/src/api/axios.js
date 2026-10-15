import axios from "axios";

export const TOKEN_KEY = "raphacare_token";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isUnauthorized = error.response?.status === 401;
    const isLoginRequest = error.config?.url?.includes("/auth/login");

    if (isUnauthorized && !isLoginRequest) {
      const sentToken = error.config?.headers?.Authorization;
      const currentToken = localStorage.getItem(TOKEN_KEY);

      if (currentToken && sentToken === `Bearer ${currentToken}`) {
        localStorage.removeItem(TOKEN_KEY);

        if (window.location.pathname !== "/login") {
          window.location.replace("/login");
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
