import { Navigate, Route, Routes } from "react-router-dom";
import { EmployerLayout } from "./layouts/EmployerLayout";
import { LoginPage } from "./pages/LoginPage";
import { isAuthenticated } from "./services/auth";
import { DashboardPage } from "./pages/DashboardPage";
import { EmployeesPage } from "./pages/EmployeesPage";
import { RequestsPage } from "./pages/RequestsPage";
import { RepaymentsPage } from "./pages/RepaymentsPage";

function ProtectedRoute() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <EmployerLayout />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/requests" element={<RequestsPage />} />
        <Route path="/repayments" element={<RepaymentsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
