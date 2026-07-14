import type { AuthUser, LoginCredentials, LoginResponse, UserSession } from "../types";
import { mapAuthUser, mapUserSession, unwrapItem, unwrapList } from "./api-mappers";
import { isNotFound } from "./api-errors";
import { httpClient } from "./http-client";
import { tokenStore } from "./token-store";
import { decodeJwtPayload } from "../utils/jwt";

const USER_KEY = "mobpae_employer_user";
const EMPLOYER_ROLE = "EMPLOYER";
const EMPLOYER_ACCESS_MESSAGE =
  "This account does not have access to the Employer portal.";

class EmployerAccessError extends Error {}

const getStoredUser = (): AuthUser | null => {
  try {
    const stored = localStorage.getItem(USER_KEY);
    const user = stored ? (JSON.parse(stored) as AuthUser) : null;

    if (user && user.role !== EMPLOYER_ROLE) {
      tokenStore.clearAll();
      return null;
    }

    return user;
  } catch {
    tokenStore.clearAll();
    return null;
  }
};

const ensureEmployerRole = (user: AuthUser) => {
  if (user.role !== EMPLOYER_ROLE) {
    tokenStore.clearAll();
    throw new EmployerAccessError(EMPLOYER_ACCESS_MESSAGE);
  }

  return user;
};

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { data } = await httpClient.post("/auth/login", {
      ...credentials,
      email: credentials.email.trim().toLowerCase(),
    });
    const responseData = unwrapItem<Record<string, unknown>>(data);
    const token = String(responseData.accessToken ?? responseData.token ?? responseData.jwt ?? "");

    if (!token) {
      throw new Error("Login response did not include an access token");
    }

    const tokenPayload = decodeJwtPayload(token);
    const userSource = {
      ...tokenPayload,
      ...((responseData.user ?? responseData.profile ?? responseData) as Record<string, unknown>)
    };
    let user: AuthUser = ensureEmployerRole(mapAuthUser(userSource));

    tokenStore.setToken(token);

    // Store refresh token only after the portal role has been verified.
    const refreshToken = String(responseData.refreshToken ?? "");
    if (refreshToken) tokenStore.setRefreshToken(refreshToken);

    try {
      const profile = await this.refreshCurrentUser();
      if (profile) user = profile;
    } catch (error) {
      if (error instanceof EmployerAccessError) throw error;
      // Keep the user returned by login when /auth/me is not available for this token.
    }

    const userObj = (responseData.user ?? responseData.profile ?? responseData) as Record<string, unknown>;
    const passwordChanged = Boolean(userObj.passwordChanged ?? responseData.passwordChanged);
    const response: LoginResponse = { token, user, passwordChanged };

    localStorage.setItem(USER_KEY, JSON.stringify(response.user));

    return response;
  },

  async logout(): Promise<void> {
    tokenStore.clearAll();
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    const token = tokenStore.getToken();
    if (!token) return null;

    if (decodeJwtPayload(token).role !== EMPLOYER_ROLE) {
      tokenStore.clearAll();
      return null;
    }

    // Always prefer a fresh /auth/me over the cached copy — refreshCurrentUser()
    // already falls back to the cache on network failure, so this keeps stale
    // localStorage data (e.g. from a fixed mapping bug) from persisting forever.
    return this.refreshCurrentUser();
  },

  async refreshCurrentUser(): Promise<AuthUser | null> {
    if (!tokenStore.getToken()) return null;

    try {
      const { data } = await httpClient.get("/auth/me");
      const user = ensureEmployerRole(
        mapAuthUser(unwrapItem(data, ["user", "profile"]))
      );
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
    } catch (error) {
      if (error instanceof EmployerAccessError) throw error;
      // Fall back to cached user so refreshes do not log users out on transient API failures.
    }

    return getStoredUser();
  },

  isAuthenticated(): boolean {
    return Boolean(tokenStore.getToken());
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await httpClient.post("/auth/change-password", { currentPassword, newPassword });
  },

  async forgotPassword(email: string): Promise<void> {
    await httpClient.post("/auth/forgot-password", {
      email: email.trim().toLowerCase(),
    });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await httpClient.post("/auth/reset-password", { token, newPassword });
  },

  async getSessions(): Promise<UserSession[]> {
    try {
      const { data } = await httpClient.get("/auth/sessions");
      return unwrapList(data, ["sessions"]).map(mapUserSession);
    } catch (error) {
      // Endpoint may not exist yet on older backends — show nothing rather than crash.
      if (isNotFound(error)) return [];
      throw error;
    }
  },

  async revokeSession(id: string): Promise<void> {
    await httpClient.delete(`/auth/sessions/${id}`);
  },
};
