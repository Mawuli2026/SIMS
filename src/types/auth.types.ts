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
