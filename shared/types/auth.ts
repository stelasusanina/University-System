export const ROLE_LABELS: Record<string, string> = {
  СТУДЕНТ: "Студент",
  АСИСТЕНТ: "Асистент",
  ГЛАВЕН_АСИСТЕНТ: "Гл. асистент",
  ДОЦЕНТ: "Доцент",
  ПРОФЕСОР: "Професор",
};

export type User = {
  id: number;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  user: User;
};

export type RegisterRequest = {
  email: string;
  identifierNumber: string;
  firstName: string;
  lastName: string;
  password: string;
};
