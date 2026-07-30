export type UserRole = "Admin" | "Cashier";

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  password: string;
  confirmPassword: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokenPayload {
  sub: string;
  role: UserRole;
}

export interface AuthenticatedUser {
  id: number;
  role: UserRole;
}

export interface UserRow {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
}

export interface PublicUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

export interface LoginResult {
  token: string;
  user: PublicUser;
}
