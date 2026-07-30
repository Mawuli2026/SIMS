import { NextFunction, Request, Response } from "express";
import { UserRole } from "../types/auth.types";

/**
 * Restricts a route to the given list of roles. Must run after `authenticate`,
 * since it relies on `request.authUser` being populated.
 */
export const authorize = (...allowedRoles: UserRole[]) =>
  (request: Request, response: Response, next: NextFunction) => {
    const authUser = request.authUser;

    if (!authUser) {
      response.status(401).json({ message: "Authentication token is required." });
      return;
    }

    if (!allowedRoles.includes(authUser.role)) {
      response.status(403).json({ message: "You do not have permission to access this resource." });
      return;
    }

    next();
  };
