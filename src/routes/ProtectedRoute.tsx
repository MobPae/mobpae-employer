import { useEffect, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading, logout, user } = useAuth();
  const location = useLocation();
  const isWrongRole = Boolean(user) && user?.role !== "EMPLOYER";

  useEffect(() => {
    if (isWrongRole) {
      void logout();
    }
  }, [isWrongRole, logout]);

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-blue-50 text-sm font-semibold text-blue-700">Loading MobPae...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (isWrongRole) {
    return <Navigate to="/login" replace state={{ from: location, roleError: "EMPLOYER" }} />;
  }

  return <>{children}</>;
}
