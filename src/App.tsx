import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./auth/LoginPage";
import ProtectedRoute from "./auth/ProtectedRoute";

import DashboardPage from "./pages/dashboard/DashboardPage";
import EmployeesPage from "./pages/employees/EmployeesPage";
import ReportsPage from "./pages/reports/ReportsPage";

import SalaryRequestsPage from "./pages/salary-requests/SalaryRequestsPage";
import PayrollSettingsPage from "./pages/payroll-settings/PayrollSettingsPage";
import CompanyProfilePage from "./pages/company-profile/CompanyProfilePage";
import EmployerLayout from "./layouts/EmployerLayout";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          element={
            <ProtectedRoute>
              <EmployerLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />

          <Route path="/employees" element={<EmployeesPage />} />

          <Route path="/salary-requests" element={<SalaryRequestsPage />} />

          <Route path="/payroll-settings" element={<PayrollSettingsPage />} />

          <Route path="/company-profile" element={<CompanyProfilePage />} />

          <Route path="/reports" element={<ReportsPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
