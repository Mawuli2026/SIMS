import { createHash, randomBytes } from "crypto";

const DEFAULT_RESET_TOKEN_TTL_MINUTES = 30;

export const createPasswordResetToken = () => randomBytes(32).toString("hex");

export const hashPasswordResetToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export const getPasswordResetTtlMinutes = () => {
  const configuredTtl = Number(process.env.PASSWORD_RESET_TTL_MINUTES);
  return Number.isInteger(configuredTtl) && configuredTtl > 0
    ? configuredTtl
    : DEFAULT_RESET_TOKEN_TTL_MINUTES;
};
