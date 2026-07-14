import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { EmployerLayout } from "../components/layout/EmployerLayout";
import { AuthProvider } from "../context/AuthProvider";
import { ToastProvider } from "../context/ToastProvider";
import { LoginPage } from "../pages/auth/LoginPage";
import { ForgotPasswordPage } from "../pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "../pages/auth/ResetPasswordPage";
import { ChangePasswordPage } from "../pages/auth/ChangePasswordPage";
import { ProtectedRoute } from "./ProtectedRoute";

// Lazy-loaded: everything behind the login wall. Keeps the initial bundle the
// unauthenticated LoginPage needs to download small — the rest of the app's
// pages (tables, drawers, forms) are fetched only once someone signs in.
const DashboardPage = lazy(() => import("../pages/dashboard/DashboardPage").then(m => ({ default: m.DashboardPage })));
const EmployeesPage = lazy(() => import("../pages/employees/EmployeesPage").then(m => ({ default: m.EmployeesPage })));
const SalaryRequestsPage = lazy(() => import("../pages/salary-requests/SalaryRequestsPage").then(m => ({ default: m.SalaryRequestsPage })));
const RepaymentsPage = lazy(() => import("../pages/repayments/RepaymentsPage").then(m => ({ default: m.RepaymentsPage })));
const SettlementsPage = lazy(() => import("../pages/settlements/SettlementsPage").then(m => ({ default: m.SettlementsPage })));
const SettingsPage = lazy(() => import("../pages/settings/SettingsPage").then(m => ({ default: m.SettingsPage })));
const ProfilePage = lazy(() => import("../pages/profile/ProfilePage").then(m => ({ default: m.ProfilePage })));
const NotificationsPage = lazy(() => import("../pages/notifications/NotificationsPage").then(m => ({ default: m.NotificationsPage })));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage").then(m => ({ default: m.NotFoundPage })));

export function AppRoutes() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            element={
              <ProtectedRoute>
                <EmployerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"       element={<DashboardPage />}       />
            <Route path="/employees"       element={<EmployeesPage />}       />
            <Route path="/loan-applications" element={<SalaryRequestsPage />}  />
            <Route path="/recoveries"      element={<Navigate to="/repayments" replace />} />
            <Route path="/repayments"      element={<RepaymentsPage />}       />
            <Route path="/settlements"     element={<SettlementsPage />}      />
            <Route path="/settings"        element={<SettingsPage />}         />
            <Route path="/profile"         element={<ProfilePage />}          />
            <Route path="/notifications"   element={<NotificationsPage />}    />
            <Route path="*"                element={<NotFoundPage />}         />
          </Route>
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
