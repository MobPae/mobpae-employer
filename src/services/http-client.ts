import axios from "axios";
import { tokenStore } from "./token-store";

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
  try {
    const [, payload] = token.split(".");
    if (!payload) return false;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );
    return JSON.parse(atob(padded))?.role === "EMPLOYER";
  } catch {
    return false;
  }
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

    const storedRefreshToken = tokenStore.getRefreshToken();
    if (!storedRefreshToken) {
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
      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

      drainQueue(data.accessToken);
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
