import { query } from "../config/db";
import { getLoginSecurityConfig } from "../config/loginSecurity";
import {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResult,
  PasswordResetDelivery,
  PublicUser,
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
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly userId: number | null = null,
  ) {
    super(message);
    this.name = "AuthServiceError";
  }
}

const accountLockedMessage = "Too many unsuccessful sign-in attempts. Try again later or reset your password.";

interface FailedLoginAttemptRow {
  failed_login_attempts: number;
  locked_until: Date | null;
}

const recordFailedLoginAttempt = async (userId: number): Promise<FailedLoginAttemptRow> => {
  const config = getLoginSecurityConfig();
  const nextAttempt = `CASE
    WHEN last_failed_login_at IS NULL
      OR last_failed_login_at <= NOW() - ($2::integer * INTERVAL '1 minute')
      OR (locked_until IS NOT NULL AND locked_until <= NOW())
    THEN 1
    ELSE failed_login_attempts + 1
  END`;
  const result = await query<FailedLoginAttemptRow>(
    `UPDATE users
     SET failed_login_attempts = ${nextAttempt},
         locked_until = CASE
           WHEN (${nextAttempt}) >= $3::integer
           THEN NOW() + ($4::integer * INTERVAL '1 minute')
           ELSE NULL
         END,
         last_failed_login_at = NOW(),
         updated_at = NOW()
     WHERE id = $1
     RETURNING failed_login_attempts, locked_until`,
    [userId, config.failedAttemptWindowMinutes, config.maxFailedAttempts, config.lockoutMinutes],
  );
  return result.rows[0];
};

const isLocked = (lockedUntil: Date | null) => Boolean(lockedUntil && lockedUntil.getTime() > Date.now());

const toPublicUser = (user: UserRow): PublicUser => ({
  id: user.id,
  firstName: user.first_name,
  lastName: user.last_name,
  email: user.email,
  role: user.role,
  mustChangePassword: user.must_change_password,
  createdAt: user.created_at,
});

export const loginUser = async (input: LoginRequest): Promise<LoginResult> => {
  const email = input.email.trim().toLowerCase();
  const result = await query<UserRow>(
    `SELECT id, first_name, last_name, email, password_hash, role, account_status, must_change_password, token_version,
            failed_login_attempts, last_failed_login_at, locked_until, created_at
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [email],
  );
  const user = result.rows[0];

  if (!user) {
    throw new AuthServiceError("Invalid email or password.", 401);
  }
  if (isLocked(user.locked_until)) {
    throw new AuthServiceError(accountLockedMessage, 429, user.id);
  }
  if (!(await comparePassword(input.password, user.password_hash))) {
    const failedAttempt = await recordFailedLoginAttempt(user.id);
    if (isLocked(failedAttempt.locked_until)) {
      throw new AuthServiceError(accountLockedMessage, 429, user.id);
    }
    throw new AuthServiceError("Invalid email or password.", 401, user.id);
  }
  if (user.account_status === "disabled") {
    throw new AuthServiceError("This account has been disabled. Contact a System Administrator.", 403, user.id);
  }

  await query(
    `UPDATE users
     SET last_login_at = NOW(),
         failed_login_attempts = 0,
         last_failed_login_at = NULL,
         locked_until = NULL,
         updated_at = NOW()
     WHERE id = $1`,
    [user.id],
  );

  const publicUser = toPublicUser(user);
  return {
    token: generateAuthToken({ id: user.id, role: user.role, tokenVersion: user.token_version }),
    user: publicUser,
  };
};

export const getUserById = async (userId: number): Promise<PublicUser> => {
  const result = await query<UserRow>(
    `SELECT id, first_name, last_name, email, password_hash, role, account_status, must_change_password, token_version, created_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId],
  );
  const user = result.rows[0];
  if (!user) throw new AuthServiceError("User account not found.", 404);
  return toPublicUser(user);
};

export const requestPasswordReset = async (input: ForgotPasswordRequest): Promise<PasswordResetDelivery | null> => {
  const email = input.email.trim().toLowerCase();
  const resetToken = createPasswordResetToken();
  const tokenHash = hashPasswordResetToken(resetToken);
  const tokenTtlMinutes = getPasswordResetTtlMinutes();

  const result = await query<{ id: number; first_name: string; last_name: string; email: string }>(
    `UPDATE users
     SET reset_token = $1,
         reset_token_expires = NOW() + ($2::integer * INTERVAL '1 minute'),
         updated_at = NOW()
     WHERE email = $3
     RETURNING id, first_name, last_name, email`,
    [tokenHash, tokenTtlMinutes, email],
  );

  const user = result.rows[0];
  return user ? {
    userId: user.id,
    resetToken,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
  } : null;
};

export const resetPassword = async (input: ResetPasswordRequest): Promise<number> => {
  const tokenHash = hashPasswordResetToken(input.resetToken.trim());
  const passwordHash = await hashPassword(input.password);

  const result = await query<{ id: number }>(
    `UPDATE users
     SET password_hash = $1,
         reset_token = NULL,
         reset_token_expires = NULL,
         must_change_password = FALSE,
         token_version = token_version + 1,
         failed_login_attempts = 0,
         last_failed_login_at = NULL,
         locked_until = NULL,
         updated_at = NOW()
     WHERE reset_token = $2
       AND reset_token_expires > NOW()
     RETURNING id`,
    [passwordHash, tokenHash],
  );

  if (!result.rowCount) {
    throw new AuthServiceError("Password reset link is invalid or has expired.", 400);
  }
  return result.rows[0].id;
};

export const changePassword = async (
  userId: number,
  input: ChangePasswordRequest,
): Promise<LoginResult> => {
  const result = await query<Pick<UserRow, "password_hash">>(
    "SELECT password_hash FROM users WHERE id = $1 LIMIT 1",
    [userId],
  );
  const user = result.rows[0];
  if (!user) throw new AuthServiceError("User account not found.", 404);

  if (!(await comparePassword(input.currentPassword, user.password_hash))) {
    throw new AuthServiceError("Current password is incorrect.", 400);
  }
  if (await comparePassword(input.newPassword, user.password_hash)) {
    throw new AuthServiceError("New password must be different from your current password.", 400);
  }

  const passwordHash = await hashPassword(input.newPassword);
  const updated = await query<{ token_version: number }>(
    `UPDATE users
     SET password_hash = $1,
         must_change_password = FALSE,
         token_version = token_version + 1,
         failed_login_attempts = 0,
         last_failed_login_at = NULL,
         locked_until = NULL,
         reset_token = NULL,
         reset_token_expires = NULL,
         updated_at = NOW()
     WHERE id = $2
     RETURNING token_version`,
    [passwordHash, userId],
  );
  const publicUser = await getUserById(userId);
  return {
    token: generateAuthToken({ id: publicUser.id, role: publicUser.role, tokenVersion: updated.rows[0].token_version }),
    user: publicUser,
  };
};
