import { useEffect, useMemo, useState, type ReactNode } from "react";
import { authService } from "../services/auth.service";
import type { AuthUser } from "../types";
import { AuthContext, type AuthContextValue } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService
      .getCurrentUser()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  // When the http-client detects a 401 (expired session), force the UI back to login
  // without a hard page reload.
  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      setLoading(false);
    };
    window.addEventListener("mobpae:session:expired", handleExpired);
    return () => window.removeEventListener("mobpae:session:expired", handleExpired);
  }, []);

  // Keep tabs in sync: if the token is cleared (logout / forced logout) in one tab,
  // localStorage's "storage" event fires in every other open tab.
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "mobpae_employer_token" && !e.newValue) {
        setUser(null);
        setLoading(false);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: authService.isAuthenticated(),
      login: async (credentials) => {
        const response = await authService.login(credentials);
        setUser(response.user);
        return { passwordChanged: Boolean(response.passwordChanged) };
      },
      logout: async () => {
        await authService.logout();
        setUser(null);
      }
    }),
    [loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
