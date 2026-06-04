export interface User {
  userId: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  accessToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
