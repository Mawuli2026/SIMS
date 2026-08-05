export type UserRole = 'SystemAdmin' | 'Manager' | 'Cashier';

export interface LoginFormValues {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface ForgotPasswordFormValues {
  email: string;
}

export interface ResetPasswordFormValues {
  password: string;
  confirmPassword: string;
}

export interface ResetPasswordRequest extends ResetPasswordFormValues {
  resetToken: string;
}

export interface ChangePasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ApiUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  mustChangePassword: boolean;
  createdAt: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: ApiUser;
}

export interface ForgotPasswordResponse {
  message: string;
  resetUrl?: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface CurrentUserResponse {
  user: ApiUser;
}

export interface ChangePasswordResponse {
  message: string;
  token: string;
  user: ApiUser;
}
