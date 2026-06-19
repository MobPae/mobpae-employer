import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authService } from "../services/auth.service";
import type { AuthUser, LoginCredentials } from "../types";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ passwordChanged: boolean }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

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

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
