import { Navigate, Route, Routes } from "react-router-dom";
import { EmployerLayout } from "../components/layout/EmployerLayout";
import { AuthProvider } from "../hooks/useAuth";
import { LoginPage } from "../pages/auth/LoginPage";
import { DashboardPage } from "../pages/dashboard/DashboardPage";
import { EmployeesPage } from "../pages/employees/EmployeesPage";
import { PayrollPage } from "../pages/payroll/PayrollPage";
import { RepaymentsPage } from "../pages/repayments/RepaymentsPage";
import { SalaryRequestsPage } from "../pages/salary-requests/SalaryRequestsPage";
import { SettingsPage } from "../pages/settings/SettingsPage";
import { ProtectedRoute } from "./ProtectedRoute";

export function AppRoutes() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<EmployerLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/salary-requests" element={<SalaryRequestsPage />} />
            <Route path="/repayments" element={<RepaymentsPage />} />
            <Route path="/payroll" element={<PayrollPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
