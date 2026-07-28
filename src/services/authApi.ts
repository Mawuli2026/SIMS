import {
  CurrentUserResponse,
  ForgotPasswordFormValues,
  ForgotPasswordResponse,
  LoginFormValues,
  LoginResponse,
  RegisterFormValues,
  RegisterResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from "../types/auth.types";

const configuredApiUrl = document.querySelector<HTMLMetaElement>('meta[name="sims-api-url"]')?.content;
const API_URL = (configuredApiUrl && !configuredApiUrl.startsWith("%") ? configuredApiUrl : "http://localhost:5000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch {
    throw new ApiError("Unable to connect to the server. Please try again.", 0);
  }

  const data = await response.json().catch(() => ({})) as { message?: string };
  if (!response.ok) throw new ApiError(data.message ?? "The request could not be completed.", response.status);
  return data as T;
};

export const registerAccount = (values: RegisterFormValues) => request<RegisterResponse>("/api/auth/register", {
  method: "POST",
  body: JSON.stringify(values),
});

export const loginAccount = ({ email, password }: LoginFormValues) => request<LoginResponse>("/api/auth/login", {
  method: "POST",
  body: JSON.stringify({ email, password }),
});

export const getCurrentUser = (token: string) => request<CurrentUserResponse>("/api/auth/me", {
  headers: { Authorization: `Bearer ${token}` },
});

export const requestPasswordReset = (values: ForgotPasswordFormValues) =>
  request<ForgotPasswordResponse>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(values),
  });

export const resetAccountPassword = (values: ResetPasswordRequest) =>
  request<ResetPasswordResponse>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(values),
  });
