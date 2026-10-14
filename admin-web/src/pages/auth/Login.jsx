
import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ArrowRight,
} from "lucide-react";

import AuthLayout from "../../components/auth/AuthLayout.jsx";

export default function Login() {
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  // Handle login submission
  function submit(e) {
    e.preventDefault();

    setError(
      "Login is not connected yet. "
    );
  }

  return (
    <AuthLayout>
      {/* Page Heading */}
      <h2 className="heading">
        Sign in to your account
      </h2>

      <p className="subheading">
        Access the RaphaCare portal.
      </p>

      {/* Login Form */}
      <form onSubmit={submit} className="mt-9 space-y-5">

        {/* Email Address */}
        <div>
          <label htmlFor="email" className="field-label">
            Email address
          </label>

          <div className="field">
            <Mail size={18} />

            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              placeholder="Enter your work email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {/* Password */}
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
              type={show ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {/* Show / Hide Password */}
            <button
              type="button"
              aria-label={show ? "Hide password" : "Show password"}
              onClick={() => setShow(!show)}
              className="text-slate-500"
            >
              {show ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <p role="alert" className="message">
            {error}
          </p>
        )}

        {/* Sign In Button */}
        <button type="submit" className="primary-btn">
          Sign in
          <ArrowRight size={18} />
        </button>
      </form>
    </AuthLayout>
  );
}
