import { NextFunction, Request, Response } from "express";
import {
  AuthServiceError,
  changePassword as changeUserPassword,
  getUserById,
  loginUser,
  requestPasswordReset,
  resetPassword as resetUserPassword,
} from "../services/auth.service";
import {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  ResetPasswordRequest,
} from "../types/auth.types";
import {
  changePasswordSchema,
  firstValidationError,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from "../utils/validation";
import { isEmailConfigured } from "../config/email";
import { sendPasswordResetEmail } from "../services/email.service";
import { getPasswordResetTtlMinutes } from "../utils/passwordReset";
import { getAuditRequestContext, recordAuditEvent } from "../services/audit.service";

const passwordResetRequestMessage = "If an account exists for that email, password reset instructions have been created.";

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
    await recordAuditEvent({
      actorUserId: result.user.id,
      targetUserId: result.user.id,
      action: "AUTH_LOGIN_SUCCESS",
      entityType: "authentication",
      entityId: result.user.id,
      outcome: "success",
      details: { role: result.user.role },
      ...getAuditRequestContext(request),
    });
    response.status(200).json({ message: "Login successful", ...result });
  } catch (error) {
    if (error instanceof AuthServiceError) {
      await recordAuditEvent({
        targetUserId: error.userId,
        action: error.statusCode === 429 ? "AUTH_ACCOUNT_LOCKED" : "AUTH_LOGIN_FAILURE",
        entityType: "authentication",
        entityId: error.userId,
        outcome: "failure",
        details: {
          reason: error.statusCode === 429 ? "account_locked" : error.statusCode === 403 ? "account_disabled" : "invalid_credentials",
        },
        ...getAuditRequestContext(request),
      });
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
    const resetRequest = await requestPasswordReset(validation.data);
    const payload: { message: string; resetUrl?: string } = { message: passwordResetRequestMessage };
    let delivery = "not_available";

    if (resetRequest) {
      const clientUrl = (process.env.CLIENT_URL ?? "http://localhost:5173").replace(/\/$/, "");
      const resetUrl = `${clientUrl}/reset-password?resetToken=${encodeURIComponent(resetRequest.resetToken)}`;
      if (isEmailConfigured()) {
        try {
          await sendPasswordResetEmail({
            recipientEmail: resetRequest.email,
            recipientName: `${resetRequest.firstName} ${resetRequest.lastName}`.trim(),
            resetUrl,
            expiresMinutes: getPasswordResetTtlMinutes(),
          });
          delivery = "email";
        } catch (error) {
          console.error("Password reset email delivery failed:", error instanceof Error ? error.message : "Unknown email error.");
          if (process.env.NODE_ENV !== "production") {
            payload.resetUrl = resetUrl;
            delivery = "development_url";
          }
        }
      } else if (process.env.NODE_ENV !== "production") {
        payload.resetUrl = resetUrl;
        delivery = "development_url";
      }
    }

    await recordAuditEvent({
      targetUserId: resetRequest?.userId,
      action: "AUTH_PASSWORD_RESET_REQUESTED",
      entityType: "authentication",
      entityId: resetRequest?.userId,
      outcome: "success",
      details: { accountMatched: Boolean(resetRequest), delivery },
      ...getAuditRequestContext(request),
    });

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
    const userId = await resetUserPassword(validation.data);
    await recordAuditEvent({
      targetUserId: userId,
      action: "AUTH_PASSWORD_RESET_COMPLETED",
      entityType: "authentication",
      entityId: userId,
      outcome: "success",
      ...getAuditRequestContext(request),
    });
    response.status(200).json({ message: "Password reset successfully. Please log in with your new password." });
  } catch (error) {
    if (error instanceof AuthServiceError) {
      await recordAuditEvent({
        action: "AUTH_PASSWORD_RESET_COMPLETED",
        entityType: "authentication",
        outcome: "failure",
        details: { reason: "invalid_or_expired_token" },
        ...getAuditRequestContext(request),
      });
      response.status(error.statusCode).json({ message: error.message });
      return;
    }
    next(error);
  }
};

export const changePassword = async (
  request: Request<Record<string, never>, unknown, ChangePasswordRequest>,
  response: Response,
  next: NextFunction,
) => {
  if (!request.authUser) {
    response.status(401).json({ message: "Authentication token is required." });
    return;
  }
  const validation = changePasswordSchema.safeParse(request.body);
  if (!validation.success) {
    response.status(400).json({ message: firstValidationError(validation.error) });
    return;
  }

  try {
    const result = await changeUserPassword(request.authUser.id, validation.data);
    await recordAuditEvent({
      actorUserId: request.authUser.id,
      targetUserId: request.authUser.id,
      action: "AUTH_PASSWORD_CHANGED",
      entityType: "authentication",
      entityId: request.authUser.id,
      outcome: "success",
      ...getAuditRequestContext(request),
    });
    response.status(200).json({ message: "Password changed successfully.", ...result });
  } catch (error) {
    if (error instanceof AuthServiceError) {
      await recordAuditEvent({
        actorUserId: request.authUser.id,
        targetUserId: request.authUser.id,
        action: "AUTH_PASSWORD_CHANGED",
        entityType: "authentication",
        entityId: request.authUser.id,
        outcome: "failure",
        details: { reason: "password_change_rejected" },
        ...getAuditRequestContext(request),
      });
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
