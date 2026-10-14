import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import AdminDashboard from "./pages/admin/Dashboard.jsx";
import "./index.css";

function RequireDemoSession({ children }) {
  return sessionStorage.getItem("raphacare_demo_admin") === "true"
    ? children
    : <Navigate to="/login" replace />;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode><BrowserRouter><Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/admin/dashboard" element={<RequireDemoSession><AdminDashboard /></RequireDemoSession>} />
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes></BrowserRouter></React.StrictMode>
);
