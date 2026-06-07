import type { AuthUser, LoginCredentials, LoginResponse } from "../types";

const TOKEN_KEY = "mobpae_employer_token";
const USER_KEY = "mobpae_employer_user";

const demoUser: AuthUser = {
  id: "usr_employer_admin",
  name: "Ananya Mehra",
  email: "employer@mobpae.com",
  role: "EMPLOYER_ADMIN",
  companyName: "Nimbus Retail Pvt Ltd",
  companyCode: "NRPL-4821"
};

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    if (credentials.email !== "employer@mobpae.com" || credentials.password !== "MobPae@123") {
      throw new Error("Invalid employer credentials");
    }

    const response: LoginResponse = {
      token: "demo-employer-jwt-token",
      user: demoUser
    };

    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));

    return response;
  },

  async logout(): Promise<void> {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? (JSON.parse(stored) as AuthUser) : null;
  },

  isAuthenticated(): boolean {
    return Boolean(localStorage.getItem(TOKEN_KEY));
  }
};
