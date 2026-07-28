import { query } from "../config/db";
import {
  ForgotPasswordRequest,
  LoginRequest,
  LoginResult,
  PublicUser,
  RegisterRequest,
  ResetPasswordRequest,
  UserRow,
} from "../types/auth.types";
import { comparePassword, hashPassword } from "../utils/password";
import {
  createPasswordResetToken,
  getPasswordResetTtlMinutes,
  hashPasswordResetToken,
} from "../utils/passwordReset";
import { generateAuthToken } from "../utils/token";

export class AuthServiceError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = "AuthServiceError";
  }
}

const toPublicUser = (user: UserRow): PublicUser => ({
  id: user.id,
  firstName: user.first_name,
  lastName: user.last_name,
  email: user.email,
  role: user.role,
  createdAt: user.created_at,
});

export const registerUser = async (input: RegisterRequest): Promise<PublicUser> => {
  const email = input.email.trim().toLowerCase();
  const existingUser = await query<{ id: number }>("SELECT id FROM users WHERE email = $1 LIMIT 1", [email]);
  if (existingUser.rowCount) throw new AuthServiceError("Email already exists.", 409);

  const passwordHash = await hashPassword(input.password);

  try {
    const result = await query<UserRow>(
      `INSERT INTO users (first_name, last_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, first_name, last_name, email, password_hash, role, created_at`,
      [input.firstName.trim(), input.lastName.trim(), email, passwordHash, input.role],
    );
    return toPublicUser(result.rows[0]);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      throw new AuthServiceError("Email already exists.", 409);
    }
    throw error;
  }
};

export const loginUser = async (input: LoginRequest): Promise<LoginResult> => {
  const email = input.email.trim().toLowerCase();
  const result = await query<UserRow>(
    `SELECT id, first_name, last_name, email, password_hash, role, created_at
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [email],
  );
  const user = result.rows[0];

  if (!user || !(await comparePassword(input.password, user.password_hash))) {
    throw new AuthServiceError("Invalid email or password.", 401);
  }

  const publicUser = toPublicUser(user);
  return { token: generateAuthToken(publicUser), user: publicUser };
};

export const getUserById = async (userId: number): Promise<PublicUser> => {
  const result = await query<UserRow>(
    `SELECT id, first_name, last_name, email, password_hash, role, created_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId],
  );
  const user = result.rows[0];
  if (!user) throw new AuthServiceError("User account not found.", 404);
  return toPublicUser(user);
};

export const requestPasswordReset = async (input: ForgotPasswordRequest): Promise<string | null> => {
  const email = input.email.trim().toLowerCase();
  const resetToken = createPasswordResetToken();
  const tokenHash = hashPasswordResetToken(resetToken);
  const tokenTtlMinutes = getPasswordResetTtlMinutes();

  const result = await query<{ id: number }>(
    `UPDATE users
     SET reset_token = $1,
         reset_token_expires = NOW() + ($2::integer * INTERVAL '1 minute'),
         updated_at = NOW()
     WHERE email = $3
     RETURNING id`,
    [tokenHash, tokenTtlMinutes, email],
  );

  return result.rowCount ? resetToken : null;
};

export const resetPassword = async (input: ResetPasswordRequest): Promise<void> => {
  const tokenHash = hashPasswordResetToken(input.resetToken.trim());
  const passwordHash = await hashPassword(input.password);

  const result = await query<{ id: number }>(
    `UPDATE users
     SET password_hash = $1,
         reset_token = NULL,
         reset_token_expires = NULL,
         updated_at = NOW()
     WHERE reset_token = $2
       AND reset_token_expires > NOW()
     RETURNING id`,
    [passwordHash, tokenHash],
  );

  if (!result.rowCount) {
    throw new AuthServiceError("Password reset link is invalid or has expired.", 400);
  }
};
