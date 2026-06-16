import type { AuthUser, LoginCredentials, LoginResponse } from "../types";
import { mapAuthUser, unwrapItem } from "./api-mappers";
import { httpClient } from "./http-client";

const TOKEN_KEY = "mobpae_employer_token";
const USER_KEY = "mobpae_employer_user";

const decodeJwtPayload = (token: string): Record<string, unknown> => {
  try {
    const [, payload] = token.split(".");
    if (!payload) return {};

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(normalizedPayload));
    return decoded && typeof decoded === "object" ? decoded : {};
  } catch {
    return {};
  }
};

const getStoredUser = (): AuthUser | null => {
  const stored = localStorage.getItem(USER_KEY);
  return stored ? (JSON.parse(stored) as AuthUser) : null;
};

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { data } = await httpClient.post("/auth/login", credentials);
    const responseData = unwrapItem<Record<string, unknown>>(data);
    const token = String(responseData.accessToken ?? responseData.token ?? responseData.jwt ?? "");

    if (!token) {
      throw new Error("Login response did not include an access token");
    }

    localStorage.setItem(TOKEN_KEY, token);

    const tokenPayload = decodeJwtPayload(token);
    const userSource = {
      ...tokenPayload,
      ...((responseData.user ?? responseData.profile ?? responseData) as Record<string, unknown>)
    };
    let user: AuthUser = mapAuthUser(userSource);

    try {
      const profile = await this.refreshCurrentUser();
      if (profile) user = profile;
    } catch {
      // Keep the user returned by login when /auth/me is not available for this token.
    }

    const response: LoginResponse = { token, user };

    localStorage.setItem(USER_KEY, JSON.stringify(response.user));

    return response;
  },

  async logout(): Promise<void> {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    if (!localStorage.getItem(TOKEN_KEY)) {
      return null;
    }

    const storedUser = getStoredUser();
    if (storedUser) {
      return storedUser;
    }

    return this.refreshCurrentUser();
  },

  async refreshCurrentUser(): Promise<AuthUser | null> {
    if (!localStorage.getItem(TOKEN_KEY)) {
      return null;
    }

    try {
      const { data } = await httpClient.get("/auth/me");
      const user = mapAuthUser(unwrapItem(data, ["user", "profile"]));
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
    } catch {
      // Fall back to cached user so refreshes do not log users out on transient API failures.
    }

    return getStoredUser();
  },

  isAuthenticated(): boolean {
    return Boolean(localStorage.getItem(TOKEN_KEY));
  }
};
