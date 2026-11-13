
import React from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/auth/Login.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import ResetPassword from "./pages/auth/ResetPassword.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import AdminDashboard from "./pages/Dashboard.jsx";
import PetPatientManagement from "./pages/PetPatientManagement.jsx";
import RecordsManagement from "./pages/RecordsManagement.jsx";
import AuditLog from "./pages/AuditLog.jsx";
import AppointmentsVisits from "./pages/AppointmentsVisits.jsx";
import AddAppointment from "./pages/AddAppointment.jsx";
import AddVisit from "./pages/AddVisit.jsx";
import ContentManagement from "./pages/ContentManagement.jsx";
import Reports from "./pages/Reports.jsx";
import AdminSetting from "./pages/AdminSetting.jsx";

import { AuthProvider } from "./context/authContext.jsx";
import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";

import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />

          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />
          
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Admin-only routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="pet-management" element={<PetPatientManagement />} />
            <Route path="records" element={<RecordsManagement />} />
            <Route path="audit-log" element={<AuditLog />} />
            <Route path="appointments" element={<AppointmentsVisits />} />
            <Route path="appointments/add" element={<AddAppointment />} />
            <Route path="visits/add" element={<AddVisit />} />
            <Route path="content-manager" element={<ContentManagement />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<AdminSetting />} />
          </Route>

          {/* Fallback */}
          <Route
            path="*"
            element={<Navigate to="/login" replace />}
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
