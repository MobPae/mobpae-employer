import axios from "axios";
import { getToken, removeToken } from "./auth";

export const api = axios.create({
  baseURL: "http://localhost:3000/api/v1",
});

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes("/auth/login");

    if (error.response?.status === 401 && !isLoginRequest) {
      removeToken();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);
