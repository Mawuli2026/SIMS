import jwt, { SignOptions } from "jsonwebtoken";
import { UserRole } from "../types/auth.types";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === "replace_with_a_long_random_secret") {
    throw new Error("JWT_SECRET must be configured with a secure random value.");
  }
  return secret;
};

interface TokenUser {
  id: number;
  role: UserRole;
  tokenVersion: number;
}

export const generateAuthToken = (user: TokenUser) => {
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? "1d") as SignOptions["expiresIn"];
  return jwt.sign({ role: user.role, ver: user.tokenVersion }, getJwtSecret(), {
    subject: String(user.id),
    expiresIn,
  });
};

export const verifyAuthToken = (token: string) => jwt.verify(token, getJwtSecret());
