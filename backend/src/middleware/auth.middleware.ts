import { NextFunction, Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { query } from "../config/db";
import { UserRole } from "../types/auth.types";
import { verifyAuthToken } from "../utils/token";

const isUserRole = (role: unknown): role is UserRole =>
  role === "SystemAdmin" || role === "Manager" || role === "Cashier";

interface AccountAccessRow {
  role: UserRole;
  account_status: "active" | "disabled";
  must_change_password: boolean;
  token_version: number;
}

export const authenticate = async (request: Request, response: Response, next: NextFunction) => {
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

  let id: number;
  let tokenVersion: number;
  try {
    const payload = verifyAuthToken(token);
    if (typeof payload === "string") throw new Error("Invalid token payload.");

    const { sub, role, ver } = payload as JwtPayload & { role?: unknown; ver?: unknown };
    id = Number(sub);
    tokenVersion = Number(ver);
    if (!Number.isInteger(id) || id < 1 || !isUserRole(role) || !Number.isInteger(tokenVersion) || tokenVersion < 0) {
      throw new Error("Invalid token claims.");
    }
  } catch {
    response.status(401).json({ message: "Invalid or expired authentication token." });
    return;
  }

  try {
    const result = await query<AccountAccessRow>(
      "SELECT role, account_status, must_change_password, token_version FROM users WHERE id = $1 LIMIT 1",
      [id],
    );
    const account = result.rows[0];
    if (!account || account.account_status === "disabled") {
      response.status(401).json({ message: "This account is disabled or no longer available." });
      return;
    }
    if (account.token_version !== tokenVersion) {
      response.status(401).json({ message: "This authentication session has been revoked. Please sign in again." });
      return;
    }

    request.authUser = { id, role: account.role, mustChangePassword: account.must_change_password, tokenVersion };
    next();
  } catch (error) {
    next(error);
  }
};

export const requirePasswordChangeCompleted = (request: Request, response: Response, next: NextFunction) => {
  if (!request.authUser) {
    response.status(401).json({ message: "Authentication is required." });
    return;
  }
  if (request.authUser.mustChangePassword) {
    response.status(403).json({
      code: "PASSWORD_CHANGE_REQUIRED",
      message: "You must change your temporary password before accessing SIMS.",
    });
    return;
  }
  next();
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
