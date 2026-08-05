export type UserRole = "SystemAdmin" | "Manager" | "Cashier";
export type ManagementRole = Exclude<UserRole, "Cashier">;

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface PasswordResetDelivery {
  userId: number;
  resetToken: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ResetPasswordRequest {
  resetToken: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthTokenPayload {
  sub: string;
  role: UserRole;
  ver: number;
}

export interface AuthenticatedUser {
  id: number;
  role: UserRole;
  mustChangePassword: boolean;
  tokenVersion: number;
}

export interface UserRow {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  account_status: "active" | "disabled";
  must_change_password: boolean;
  token_version: number;
  failed_login_attempts: number;
  last_failed_login_at: Date | null;
  locked_until: Date | null;
  created_at: Date;
}

export interface PublicUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  mustChangePassword: boolean;
  createdAt: Date;
}

export interface LoginResult {
  token: string;
  user: PublicUser;
}
