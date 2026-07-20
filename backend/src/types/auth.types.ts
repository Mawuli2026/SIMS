export type UserRole = "Admin" | "Cashier";

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  password: string;
  confirmPassword: string;
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
