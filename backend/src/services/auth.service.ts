import { query } from "../config/db";
import { PublicUser, RegisterRequest, UserRow } from "../types/auth.types";
import { hashPassword } from "../utils/password";

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
