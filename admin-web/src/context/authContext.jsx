
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import api, { TOKEN_KEY } from "../api/axios.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setError(null);
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post("/auth/login", {
        username: username.trim(),
        password,
        platform: "web",
      });

      const { token, user: authenticatedUser } = response.data;

      localStorage.setItem(TOKEN_KEY, token);
      setUser(authenticatedUser);

      return authenticatedUser;
    } catch (err) {
      const message =
        err.response?.data?.message ??
        "Unable to log in. Please try again.";

      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      const token = localStorage.getItem(TOKEN_KEY);

      if (!token) {
        if (active) setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");

        if (active) {
          const restoredUser = response.data.user;

          if (!["admin", "vet"].includes(restoredUser.role)) {
            logout();
          } else {
            setUser(restoredUser);
          }
        }
      } catch {
        // Only invalidate a session when the API rejects it.
        // Temporary network errors should not erase the token.
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    bootstrap();

    return () => {
      active = false;
    };
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
