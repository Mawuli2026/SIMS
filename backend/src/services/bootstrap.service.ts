import { PoolClient } from "pg";
import { z } from "zod";
import { pool } from "../config/db";
import { BootstrapSystemAdminInput, BootstrappedSystemAdmin } from "../types/bootstrap.types";
import { hashPassword } from "../utils/password";

export class BootstrapSystemAdminError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BootstrapSystemAdminError";
  }
}

export const bootstrapSystemAdminSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(100, "First name must not exceed 100 characters."),
  lastName: z.string().trim().min(1, "Last name is required.").max(100, "Last name must not exceed 100 characters."),
  email: z.string().trim().min(1, "Email address is required.").email("Email address must be valid.").max(150, "Email address must not exceed 150 characters."),
  password: z.string().min(12, "SystemAdmin password must be at least 12 characters.").max(128, "SystemAdmin password must not exceed 128 characters."),
});

interface CreatedSystemAdminRow {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: "SystemAdmin";
  created_at: Date;
}

const bootstrapLockId = 7_349_127;

export const bootstrapSystemAdminWithClient = async (
  client: PoolClient,
  rawInput: BootstrapSystemAdminInput,
): Promise<BootstrappedSystemAdmin> => {
  const validation = bootstrapSystemAdminSchema.safeParse(rawInput);
  if (!validation.success) {
    throw new BootstrapSystemAdminError(validation.error.issues[0]?.message ?? "Invalid bootstrap data.");
  }

  const input = validation.data;
  const email = input.email.toLowerCase();
  const passwordHash = await hashPassword(input.password);

  await client.query("BEGIN");
  try {
    await client.query("SELECT pg_advisory_xact_lock($1)", [bootstrapLockId]);

    const existingSystemAdmin = await client.query<{ id: number }>(
      "SELECT id FROM users WHERE role = 'SystemAdmin' LIMIT 1",
    );
    if (existingSystemAdmin.rowCount) {
      throw new BootstrapSystemAdminError("A SystemAdmin account already exists. Bootstrap can only run once.");
    }

    const existingEmail = await client.query<{ id: number }>(
      "SELECT id FROM users WHERE email = $1 LIMIT 1",
      [email],
    );
    if (existingEmail.rowCount) {
      throw new BootstrapSystemAdminError("That email address already belongs to an existing employee.");
    }

    const result = await client.query<CreatedSystemAdminRow>(
      `INSERT INTO users (first_name, last_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'SystemAdmin')
       RETURNING id, first_name, last_name, email, role, created_at`,
      [input.firstName, input.lastName, email, passwordHash],
    );
    await client.query("COMMIT");

    const user = result.rows[0];
    return {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
      createdAt: user.created_at,
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      throw new BootstrapSystemAdminError("That email address already belongs to an existing employee.");
    }
    throw error;
  }
};

export const bootstrapSystemAdmin = async (input: BootstrapSystemAdminInput) => {
  const client = await pool.connect();
  try {
    return await bootstrapSystemAdminWithClient(client, input);
  } finally {
    client.release();
  }
};
