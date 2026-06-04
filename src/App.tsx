import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./auth/LoginPage";
import ProtectedRoute from "./auth/ProtectedRoute";

import DashboardPage from "./pages/dashboard/DashboardPage";
import EmployeesPage from "./pages/employees/EmployeesPage";
import SalaryLimitsPage from "./pages/salary-limits/SalaryLimitsPage";
import RequestsPage from "./pages/requests/RequestsPage";
import ReportsPage from "./pages/reports/ReportsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employees"
          element={
            <ProtectedRoute>
              <EmployeesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/salary-limits"
          element={
            <ProtectedRoute>
              <SalaryLimitsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/requests"
          element={
            <ProtectedRoute>
              <RequestsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
