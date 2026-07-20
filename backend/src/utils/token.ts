import jwt, { SignOptions } from "jsonwebtoken";
import { PublicUser } from "../types/auth.types";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === "replace_with_a_long_random_secret") {
    throw new Error("JWT_SECRET must be configured with a secure random value.");
  }
  return secret;
};

export const generateAuthToken = (user: Pick<PublicUser, "id" | "role">) => {
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? "1d") as SignOptions["expiresIn"];
  return jwt.sign({ role: user.role }, getJwtSecret(), {
    subject: String(user.id),
    expiresIn,
  });
};

export const verifyAuthToken = (token: string) => jwt.verify(token, getJwtSecret());
