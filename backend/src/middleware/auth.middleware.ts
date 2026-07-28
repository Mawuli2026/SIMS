import { NextFunction, Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { UserRole } from "../types/auth.types";
import { verifyAuthToken } from "../utils/token";

const isUserRole = (role: unknown): role is UserRole => role === "Admin" || role === "Cashier";

export const authenticate = (request: Request, response: Response, next: NextFunction) => {
  const authorization = request.header("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    response.status(401).json({ message: "Authentication token is required." });
    return;
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) {
    response.status(401).json({ message: "Authentication token is required." });
    return;
  }

  try {
    const payload = verifyAuthToken(token);
    if (typeof payload === "string") throw new Error("Invalid token payload.");

    const { sub, role } = payload as JwtPayload & { role?: unknown };
    const id = Number(sub);
    if (!Number.isInteger(id) || id < 1 || !isUserRole(role)) throw new Error("Invalid token claims.");

    request.authUser = { id, role };
    next();
  } catch {
    response.status(401).json({ message: "Invalid or expired authentication token." });
  }
};

export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  const allowedRoleSet = new Set<UserRole>(allowedRoles);

  return (request: Request, response: Response, next: NextFunction) => {
    if (!request.authUser) {
      response.status(401).json({ message: "Authentication is required." });
      return;
    }

    if (!allowedRoleSet.has(request.authUser.role)) {
      response.status(403).json({ message: "You do not have permission to access this resource." });
      return;
    }

    next();
  };
};
