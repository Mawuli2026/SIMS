import {
  ChangePasswordFormValues,
  ChangePasswordResponse,
  CurrentUserResponse,
  ForgotPasswordFormValues,
  ForgotPasswordResponse,
  LoginFormValues,
  LoginResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from "../types/auth.types";
import { apiRequest, bearerHeaders } from "./apiClient";

export { ApiError } from "./apiClient";

export const loginAccount = ({ email, password }: LoginFormValues) => apiRequest<LoginResponse>("/api/auth/login", {
  method: "POST",
  body: JSON.stringify({ email, password }),
});

export const getCurrentUser = (token: string) => apiRequest<CurrentUserResponse>("/api/auth/me", {
  headers: bearerHeaders(token),
});

export const changeAccountPassword = (token: string, values: ChangePasswordFormValues) =>
  apiRequest<ChangePasswordResponse>("/api/auth/change-password", {
    method: "POST",
    headers: bearerHeaders(token),
    body: JSON.stringify(values),
  });

export const requestPasswordReset = (values: ForgotPasswordFormValues) =>
  apiRequest<ForgotPasswordResponse>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(values),
  });

export const resetAccountPassword = (values: ResetPasswordRequest) =>
  apiRequest<ResetPasswordResponse>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(values),
  });
