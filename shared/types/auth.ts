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
