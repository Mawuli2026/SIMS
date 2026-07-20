import { NextFunction, Request, Response } from "express";
import { AuthServiceError, registerUser } from "../services/auth.service";
import { RegisterRequest } from "../types/auth.types";
import { firstValidationError, registerSchema } from "../utils/validation";

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
