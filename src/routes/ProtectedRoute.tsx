import { useEffect, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { SessionExpiryWarning } from "../components/SessionExpiryWarning";

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
    return (
      <div className="grid min-h-screen place-items-center bg-canvas">
        <div className="flex flex-col items-center gap-3">
          <img src="/logo-icon.svg" alt="" width="32" height="21" className="animate-pulse" />
          <svg className="animate-spin text-brand" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (isWrongRole) {
    return <Navigate to="/login" replace state={{ from: location, roleError: "EMPLOYER" }} />;
  }

  return (
    <>
      {children}
      <SessionExpiryWarning />
    </>
  );
}
