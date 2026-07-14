import { createContext } from "react";
import type { AuthUser, LoginCredentials } from "../types";

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ passwordChanged: boolean }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
