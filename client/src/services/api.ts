import axios from "axios";
import type { LoginRequest, LoginResponse, RegisterRequest } from "@shared/types/auth";

const client = axios.create({
  baseURL: "http://localhost:3000",
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.error || err.message || `HTTP ${err.response?.status}`;
    return Promise.reject(new Error(message));
  },
);

export const api = {
  get: <T>(endpoint: string) =>
    client.get<T>(endpoint).then((res) => res.data),
  post: <T>(endpoint: string, data: unknown) =>
    client.post<T>(endpoint, data).then((res) => res.data),
  put: <T>(endpoint: string, data: unknown) =>
    client.put<T>(endpoint, data).then((res) => res.data),
  delete: <T>(endpoint: string) =>
    client.delete<T>(endpoint).then((res) => res.data),
  postForm: <T>(endpoint: string, form: FormData) =>
    client
      .post<T>(endpoint, form, { headers: { "Content-Type": "multipart/form-data" } })
      .then((res) => res.data),
  login: (data: LoginRequest) =>
    client.post<LoginResponse>("/auth/login", data).then((res) => res.data),
  register: (data: RegisterRequest) =>
    client.post<LoginResponse>("/auth/register", data).then((res) => res.data),
};
