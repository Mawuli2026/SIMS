export type UserRole = 'Admin' | 'Cashier';

export interface LoginFormValues {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterFormValues {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordFormValues {
  email: string;
}

export interface ResetPasswordFormValues {
  password: string;
  confirmPassword: string;
}

export interface ApiUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: ApiUser;
}

export interface RegisterResponse {
  message: string;
}

export interface CurrentUserResponse {
  user: ApiUser;
}
