
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

import AuthLayout from "../../components/auth/AuthLayout.jsx";
import api from "../../api/axios.js";

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email ?? "";

  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!verificationToken) {
      setError("Verify the code before entering a new password.");
      return;
    }

    if (password.length < 12 || password.length > 128) {
      setError("Password must contain 12 to 128 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/reset-password", {
        email,
        platform: "web",
        verificationToken,
        password,
      });

      navigate("/login", {
        replace: true,
      });
    } catch (err) {
      setError(
        err.response?.data?.message ??
          "Unable to reset your password."
      );
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    if (verifying || !/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit verification code.");
      return;
    }

    setVerifying(true);
    setError("");
    setMessage("");

    try {
      const response = await api.post("/auth/verify-reset-code", {
        email,
        platform: "web",
        otp,
      });
      setVerificationToken(response.data.verificationToken);
      setMessage("Code verified. You can now set a new password.");
    } catch (err) {
      setError(
        err.response?.data?.message ?? "Unable to verify the code.",
      );
    } finally {
      setVerifying(false);
    }
  }

  async function resendCode() {
    if (resending) return;

    setResending(true);
    setError("");
    setMessage("");

    try {
      await api.post("/auth/forgot-password", {
        email,
        platform: "web",
      });

      setMessage(
        "If the account is registered, a code will be sent. " +
        "Please wait at least 60 seconds between requests."
      );
    } catch (err) {
      setError(
        err.response?.data?.message ??
          "Unable to request another code."
      );
    } finally {
      setResending(false);
    }
  }

  if (!email) {
    return (
      <AuthLayout>
        <h2 className="heading">Reset your password</h2>
        <p className="subheading">
          Please request a verification code first.
        </p>
        <Link to="/forgot-password" className="primary-btn mt-8">
          Request code <ArrowRight size={18} />
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#e4f4f6] text-teal mb-6">
        <ShieldCheck size={27} />
      </div>

      <div className="eyebrow">ACCOUNT RECOVERY</div>
      <h2 className="heading">Reset your password</h2>

      <p className="subheading">
        Enter the 6-digit code sent to your email and
        create a new password.
      </p>

      <p className="mt-4 flex items-center gap-2 text-sm text-slate-600">
        <Mail size={16} />
        {email}
      </p>

      <form onSubmit={submit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="otp" className="field-label">
            Verification code
          </label>
          <div className="field">
            <ShieldCheck size={18} />
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(e) =>
                {
                  setOtp(e.target.value.replace(/\D/g, ""));
                  setVerificationToken("");
                }
              }
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Code expires after 10 minutes.
          </p>
          <button
            type="button"
            onClick={verifyCode}
            disabled={verifying || Boolean(verificationToken)}
            className="mt-3 text-sm font-semibold text-teal hover:underline disabled:opacity-50"
          >
            {verificationToken
              ? "Code verified"
              : verifying
                ? "Verifying..."
                : "Verify code"}
          </button>
        </div>

        <div>
          <label htmlFor="password" className="field-label">
            New password
          </label>
          <div className="field">
            <LockKeyhole size={18} />
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              disabled={!verificationToken}
              minLength={12}
              maxLength={128}
              placeholder="At least 12 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="confirm" className="field-label">
            Confirm new password
          </label>
          <div className="field">
            <LockKeyhole size={18} />
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={!verificationToken}
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        {message && (
          <p role="status" className="text-sm text-teal">
            {message}
          </p>
        )}

        <button
          type="submit"
          className="primary-btn"
          disabled={loading || !verificationToken}
        >
          {loading ? "Updating..." : "Reset password"}
          <ArrowRight size={18} />
        </button>
      </form>

      <button
        type="button"
        onClick={resendCode}
        disabled={resending}
        className="mt-5 w-full text-center text-sm font-semibold text-teal hover:underline"
      >
        {resending ? "Requesting..." : "Resend code"}
      </button>

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
