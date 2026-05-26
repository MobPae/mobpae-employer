import { Navigate, Route, Routes } from "react-router-dom";
import { EmployerLayout } from "./layouts/EmployerLayout";
import { LoginPage } from "./pages/LoginPage";
import { isAuthenticated } from "./services/auth";
import { DashboardPage } from "./pages/DashboardPage";

function ProtectedRoute() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <EmployerLayout />;
}

function EmployeesPage() {
  return (
    <div className="rounded-[1.5rem] bg-white p-6 shadow-soft">Employees</div>
  );
}

function RequestsPage() {
  return (
    <div className="rounded-[1.5rem] bg-white p-6 shadow-soft">Requests</div>
  );
}

function RepaymentsPage() {
  return (
    <div className="rounded-[1.5rem] bg-white p-6 shadow-soft">Repayments</div>
  );
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
