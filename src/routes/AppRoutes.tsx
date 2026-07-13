import { Navigate, Route, Routes } from "react-router-dom";
import { EmployerLayout } from "../components/layout/EmployerLayout";
import { AuthProvider } from "../hooks/useAuth";
import { ToastProvider } from "../hooks/useToast";
import { LoginPage } from "../pages/auth/LoginPage";
import { ForgotPasswordPage } from "../pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "../pages/auth/ResetPasswordPage";
import { ChangePasswordPage } from "../pages/auth/ChangePasswordPage";
import { DashboardPage } from "../pages/dashboard/DashboardPage";
import { EmployeesPage } from "../pages/employees/EmployeesPage";
import { RepaymentsPage } from "../pages/repayments/RepaymentsPage";
import { SalaryRequestsPage } from "../pages/salary-requests/SalaryRequestsPage";
import { SettingsPage } from "../pages/settings/SettingsPage";
import { SettlementsPage } from "../pages/settlements/SettlementsPage";
import { ProtectedRoute } from "./ProtectedRoute";

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
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
