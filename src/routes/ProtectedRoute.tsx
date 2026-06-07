import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { UserRole } from "../types";

export function ProtectedRoute({ allowedRoles }: { allowedRoles?: UserRole[] }) {
  const { hasRole, isAuthenticated, loading, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-blue-50 text-sm font-semibold text-blue-700">Loading MobPae...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    void logout();
    return <Navigate to="/login" replace state={{ from: location, roleError: allowedRoles.join(", ") }} />;
  }

  return <Outlet />;
}
