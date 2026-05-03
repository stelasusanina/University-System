import { api } from "./api";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    role: string;
  };
}

export interface RegisterRequest {
  email: string;
  identifierNumber: string;
  firstName: string;
  lastName: string;
  password: string;
}

export const authService = {
  login: (data: LoginRequest) => api.post<LoginResponse>("/auth/login", data),
  register: (data: RegisterRequest) => api.post<LoginResponse>("/auth/register", data),
};
