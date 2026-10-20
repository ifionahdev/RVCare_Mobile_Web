
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  ShieldCheck,
} from "lucide-react";

import AuthLayout from "../../components/auth/AuthLayout.jsx";
import api from "../../api/axios.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();

    if (loading) return;

    const normalizedEmail = email.trim().toLowerCase();

    setLoading(true);
    setError("");

    console.debug(
      `[forgot-password] Requesting web code for ${normalizedEmail.replace(
        /^(.{2}).*(@.*)$/,
        "$1***$2",
      )}`,
    );

    try {
      const response = await api.post("/auth/forgot-password", {
        email: normalizedEmail,
        platform: "web",
      });

      console.debug(
        "[forgot-password] Backend accepted the web code request.",
        {
          status: response.status,
          requestId: response.headers["x-request-id"],
        },
      );

      navigate("/reset-password", {
        state: { email: normalizedEmail },
      });
    } catch (err) {
      console.error("[forgot-password] Web code request failed.", {
        message: err.message,
        status: err.response?.status,
        requestId: err.response?.headers?.["x-request-id"],
      });
      setError(
        err.response?.data?.message ??
          "Unable to request a code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#e4f4f6] text-teal mb-6">
        <ShieldCheck size={27} />
      </div>

      <div className="eyebrow">ACCOUNT RECOVERY</div>

      <h2 className="heading">Forgot your password?</h2>

      <p className="subheading">
        Enter your registered work email to receive a
        verification code.
      </p>

      <form onSubmit={submit} className="mt-9 space-y-5">
        <div>
          <label htmlFor="email" className="field-label">
            Email address
          </label>

          <div className="field">
            <Mail size={18} />
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          className="primary-btn"
          type="submit"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send verification code"}
          <ArrowRight size={18} />
        </button>
      </form>

      <Link
        to="/login"
        className="mt-7 flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 hover:text-teal"
      >
        <ArrowLeft size={17} />
        Back to login
      </Link>
    </AuthLayout>
  );
}
