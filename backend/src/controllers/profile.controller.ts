import { NextFunction, Request, Response } from "express";
import { AuthServiceError } from "../services/auth.service";
import { getMyProfile } from "../services/profile.service";

export const me = async (request: Request, response: Response, next: NextFunction) => {
  if (!request.authUser) {
    response.status(401).json({ message: "Authentication token is required." });
    return;
  }

  try {
    const user = await getMyProfile(request.authUser.id);
    response.status(200).json({ user });
  } catch (error) {
    if (error instanceof AuthServiceError) {
      response.status(error.statusCode).json({ message: error.message });
      return;
    }
    next(error);
  }
};
