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

      {/* Your route tree */}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset" element={<PasswordResetPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<Navigate to="/devices" replace />} />
            <Route path="devices" element={<DeviceListPage />} />
            <Route path="telemetry" element={<TelemetryPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route
              path="users"
              element={
                <ProtectedRoute role="admin">
                  <UserManagementPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
