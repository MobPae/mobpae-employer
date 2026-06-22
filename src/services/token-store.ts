// Thin localStorage wrapper for employer auth tokens.
// Kept in its own file to avoid circular imports between auth.service ↔ http-client.

const TOKEN_KEY   = "mobpae_employer_token";
const REFRESH_KEY = "mobpae_employer_refresh_token";
const USER_KEY    = "mobpae_employer_user";

export const tokenStore = {
  getToken:        () => localStorage.getItem(TOKEN_KEY) ?? "",
  setToken:        (t: string) => localStorage.setItem(TOKEN_KEY, t),
  getRefreshToken: () => localStorage.getItem(REFRESH_KEY) ?? "",
  setRefreshToken: (t: string) => localStorage.setItem(REFRESH_KEY, t),
  clearAll() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },
};
