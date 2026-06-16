import axios from "axios";

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000",
  timeout: 12000
});

httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("mobpae_employer_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Guard against multiple parallel 401s each firing a logout.
let sessionExpired = false;

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl: string = error.config?.url ?? "";
    const is401 = error.response?.status === 401;
    const isAuthEndpoint = requestUrl.includes("/auth/login");

    if (is401 && !isAuthEndpoint && !sessionExpired) {
      sessionExpired = true;
      localStorage.removeItem("mobpae_employer_token");
      localStorage.removeItem("mobpae_employer_user");
      // Notify the React auth context without a hard page reload.
      window.dispatchEvent(new CustomEvent("mobpae:session:expired"));
      // Reset flag after a short delay so a fresh login starts clean.
      setTimeout(() => { sessionExpired = false; }, 3000);
    }

    return Promise.reject(error);
  }
);
