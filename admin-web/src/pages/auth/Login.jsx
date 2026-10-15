import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, Mail, ArrowRight } from "lucide-react";
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

    if (!username.trim() || !password) return;

    try {
      const user = await login(username, password);

      if (user.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (user.role === "vet") {
        // Replace with your existing veterinarian route.
        navigate("/admin/dashboard", { replace: true });
      }
    } catch {
      // AuthContext already exposes the error message.
    }
  }


  return (
    <AuthLayout>
      <h2 className="heading">Sign in to your account</h2>
      <p className="subheading">Access the RaphaCare portal.</p>
      <form onSubmit={submit} className="mt-9 space-y-5">
        <div>
        <label htmlFor="username" className="field-label">
          Username
        </label>

        <div className="field">
          <Mail size={18} />
          <input
            id="username"
            type="text"
            autoComplete="username"
            required
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="password" className="field-label !mb-0">Password</label>
            <Link to="/forgot-password" className="text-sm font-semibold text-teal hover:underline">Forgot password?</Link>
          </div>
          <div className="field"><LockKeyhole size={18} />
            <input id="password" type={show ? "text" : "password"} autoComplete="current-password" required placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)} className="text-slate-500">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </div>
        </div>
        <button
          type="submit"
          className="primary-btn"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
          <ArrowRight size={18} />
        </button>
      </form>

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
