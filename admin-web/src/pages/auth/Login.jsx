
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ArrowRight,
} from "lucide-react";

import AuthLayout from "../../components/auth/AuthLayout.jsx";
import { useAuth } from "../../context/authContext.jsx";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  const navigate = useNavigate();
  const { login, loading, error } = useAuth();

  async function submit(event) {
    event.preventDefault();

    const normalizedEmail = username.trim().toLowerCase();

    if (!normalizedEmail || !password) return;

    try {
      // The backend uses "username" to store email addresses.
      const user = await login(normalizedEmail, password);

      if (user.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (user.role === "vet") {
        // Use the veterinarian dashboard route when available.
        navigate("/admin/dashboard", { replace: true });
      }
    } catch {
      // AuthContext provides the login error message.
    }
  }

  return (
    <AuthLayout>
      <h2 className="heading">Sign in to your account</h2>

      <p className="subheading">
        Access the RaphaCare portal.
      </p>

      <form onSubmit={submit} className="mt-9 space-y-5">
        {/* Email field */}
        <div>
          <label htmlFor="email" className="field-label">
            Email
          </label>

          <div className="field">
            <Mail size={18} />

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="Enter your email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        </div>

        {/* Password field */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="password"
              className="field-label !mb-0"
            >
              Password
            </label>

            <Link
              to="/forgot-password"
              className="text-sm font-semibold text-teal hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <div className="field">
            <LockKeyhole size={18} />

            <input
              id="password"
              name="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="button"
              aria-label={show ? "Hide password" : "Show password"}
              onClick={() => setShow(!show)}
              className="text-slate-500"
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Sign in button */}
        <button
          type="submit"
          className="primary-btn"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
          <ArrowRight size={18} />
        </button>
      </form>

      {/* Authentication error */}
      {error && (
        <p
          role="alert"
          className="mt-5 text-xs leading-relaxed text-red-600"
        >
          {error}
        </p>
      )}
    </AuthLayout>
  );
}
