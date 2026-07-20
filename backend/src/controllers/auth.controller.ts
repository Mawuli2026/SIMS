import { NextFunction, Request, Response } from "express";
import { AuthServiceError, getUserById, loginUser, registerUser } from "../services/auth.service";
import { LoginRequest, RegisterRequest } from "../types/auth.types";
import { firstValidationError, loginSchema, registerSchema } from "../utils/validation";

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
