// src/App.tsx
import { Route, Routes, Navigate } from "react-router-dom";
import DashboardLayout from "@/layouts/DashboardLayout";
import LoginPage from "@/pages/LoginPage";
import PasswordResetPage from "@/pages/PasswordResetPage";
import DeviceListPage from "@/pages/DeviceListPage";
import TelemetryPage from "@/pages/TelemetryPage";
import SettingsPage from "@/pages/SettingsPage";
import UserManagementPage from "@/pages/UserManagementPage";
import NotFoundPage from "@/pages/NotFoundPage";
import ProtectedRoute from "@/routes/ProtectedRoute";
import { Toaster } from "react-hot-toast";

export default function App() {
  return (
    <>
      {/* Toast container */}
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset" element={<PasswordResetPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            {/* Redirect “/” to “/devices” */}
            <Route index element={<Navigate to="/devices" replace />} />

            {/* Device list */}
            <Route path="devices" element={<DeviceListPage />} />

            {/* Telemetry with optional :mac; will auto-redirect to first if missing */}
            <Route path="telemetry/:mac?" element={<TelemetryPage />} />

            {/* Settings with optional :mac; will auto-redirect to first if missing */}
            <Route path="settings/:mac?" element={<SettingsPage />} />

            {/* User management (Admin only) */}
            <Route
              path="users"
              element={
                <ProtectedRoute role="Admin">
                  <UserManagementPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Route>

        {/* 404 catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
