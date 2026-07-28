import { NextFunction, Request, Response } from "express";
import {
  AuthServiceError,
  getUserById,
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPassword as resetUserPassword,
} from "../services/auth.service";
import {
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
} from "../types/auth.types";
import {
  firstValidationError,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "../utils/validation";

const passwordResetRequestMessage = "If an account exists for that email, password reset instructions have been created.";

export const register = async (
  request: Request<Record<string, never>, unknown, RegisterRequest>,
  response: Response,
  next: NextFunction,
) => {
  const validation = registerSchema.safeParse(request.body);
  if (!validation.success) {
    response.status(400).json({ message: firstValidationError(validation.error) });
    return;
  }

  try {
    await registerUser(validation.data);
    response.status(201).json({ message: "Account created successfully. Please log in." });
  } catch (error) {
    if (error instanceof AuthServiceError) {
      response.status(error.statusCode).json({ message: error.message });
      return;
    }
    next(error);
  }
};

export const login = async (
  request: Request<Record<string, never>, unknown, LoginRequest>,
  response: Response,
  next: NextFunction,
) => {
  const validation = loginSchema.safeParse(request.body);
  if (!validation.success) {
    response.status(400).json({ message: firstValidationError(validation.error) });
    return;
  }

  try {
    const result = await loginUser(validation.data);
    response.status(200).json({ message: "Login successful", ...result });
  } catch (error) {
    if (error instanceof AuthServiceError) {
      response.status(error.statusCode).json({ message: error.message });
      return;
    }
    next(error);
  }
};

export const forgotPassword = async (
  request: Request<Record<string, never>, unknown, ForgotPasswordRequest>,
  response: Response,
  next: NextFunction,
) => {
  const validation = forgotPasswordSchema.safeParse(request.body);
  if (!validation.success) {
    response.status(400).json({ message: firstValidationError(validation.error) });
    return;
  }

  try {
    const resetToken = await requestPasswordReset(validation.data);
    const payload: { message: string; resetUrl?: string } = { message: passwordResetRequestMessage };

    if (resetToken && process.env.NODE_ENV !== "production") {
      const clientUrl = (process.env.CLIENT_URL ?? "http://localhost:5173").replace(/\/$/, "");
      payload.resetUrl = `${clientUrl}/reset-password?resetToken=${encodeURIComponent(resetToken)}`;
    }

    response.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  request: Request<Record<string, never>, unknown, ResetPasswordRequest>,
  response: Response,
  next: NextFunction,
) => {
  const validation = resetPasswordSchema.safeParse(request.body);
  if (!validation.success) {
    response.status(400).json({ message: firstValidationError(validation.error) });
    return;
  }

  try {
    await resetUserPassword(validation.data);
    response.status(200).json({ message: "Password reset successfully. Please log in with your new password." });
  } catch (error) {
    if (error instanceof AuthServiceError) {
      response.status(error.statusCode).json({ message: error.message });
      return;
    }
    next(error);
  }
};

export const me = async (request: Request, response: Response, next: NextFunction) => {
  if (!request.authUser) {
    response.status(401).json({ message: "Authentication token is required." });
    return;
  }

  try {
    const user = await getUserById(request.authUser.id);
    response.status(200).json({ user });
  } catch (error) {
    if (error instanceof AuthServiceError) {
      response.status(error.statusCode).json({ message: error.message });
      return;
    }
    next(error);
  }
};
