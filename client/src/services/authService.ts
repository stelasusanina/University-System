import { api } from "./api";
import type { LoginRequest, LoginResponse, RegisterRequest } from "@shared/types/auth";

export const authService = {
  login: (data: LoginRequest) => api.post<LoginResponse>("/auth/login", data),
  register: (data: RegisterRequest) => api.post<LoginResponse>("/auth/register", data),
};
