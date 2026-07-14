import axios from "axios";
import { tokenStore } from "./token-store";
import { decodeJwtPayload } from "../utils/jwt";

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000",
  timeout: 12000,
});

// Attach JWT on every request
httpClient.interceptors.request.use((config) => {
  const token = tokenStore.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Silent token refresh on 401 — same pattern as admin portal.
// If refresh token exists: silently refresh and replay the original request.
// If no refresh token or refresh fails: clear session and redirect to login.
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

function hasEmployerRole(token: string) {
  return decodeJwtPayload(token).role === "EMPLOYER";
}

function drainQueue(newToken: string) {
  refreshQueue.forEach((cb) => cb(newToken));
  refreshQueue = [];
}

function forceLogout() {
  tokenStore.clearAll();
  sessionStorage.setItem("mobpae_session_expired", "1");
  window.dispatchEvent(new CustomEvent("mobpae:session:expired"));
  setTimeout(() => { window.location.replace("/login"); }, 50);
}

// Shared by the reactive 401 handler below and any proactive "stay signed in"
// call (e.g. a session-expiry warning) — both need the exact same refresh +
// role-check + token-storage behavior, just triggered at a different time.
async function refreshAccessToken(): Promise<string | null> {
  const storedRefreshToken = tokenStore.getRefreshToken();
  if (!storedRefreshToken) return null;

  try {
    const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
      `${httpClient.defaults.baseURL}/auth/refresh`,
      { refreshToken: storedRefreshToken },
      { headers: { "Content-Type": "application/json" } }
    );

    if (!hasEmployerRole(data.accessToken)) {
      throw new Error("This account does not have access to the Employer portal.");
    }

    tokenStore.setToken(data.accessToken);
    if (data.refreshToken) tokenStore.setRefreshToken(data.refreshToken);
    httpClient.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;

    return data.accessToken;
  } catch {
    return null;
  }
}

/** Proactively refresh the session (e.g. from a "stay signed in" prompt) without waiting for a 401. */
export async function tryRefreshSession(): Promise<boolean> {
  if (isRefreshing) return false;
  isRefreshing = true;
  try {
    const token = await refreshAccessToken();
    if (token) { drainQueue(token); return true; }
    return false;
  } finally {
    isRefreshing = false;
  }
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };
    const requestUrl: string = originalRequest?.url ?? "";
    const is401 = error.response?.status === 401;

    const isAuthEndpoint =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/refresh") ||
      requestUrl.includes("/auth/logout");

    if (!is401 || isAuthEndpoint || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (!tokenStore.getRefreshToken()) {
      forceLogout();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push((newToken: string) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          resolve(httpClient(originalRequest));
        });
        setTimeout(() => reject(error), 10000);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const newToken = await refreshAccessToken();
      if (!newToken) throw new Error("refresh failed");

      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      drainQueue(newToken);
      return httpClient(originalRequest);
    } catch {
      drainQueue("");
      forceLogout();
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);
