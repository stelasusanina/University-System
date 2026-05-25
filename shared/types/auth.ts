export interface User {
  id: number;
  email: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  identifierNumber: string;
  firstName: string;
  lastName: string;
  password: string;
}
