import { query } from "../config/db";
import {
  CreateEmployeeInput,
  Employee,
  EmployeeFilters,
  EmployeeRole,
  EmployeeStatus,
  ResetEmployeePasswordInput,
} from "../types/employee.types";
import { hashPassword } from "../utils/password";

export class EmployeeServiceError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = "EmployeeServiceError";
  }
}

interface EmployeeRow {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: "SystemAdmin" | EmployeeRole;
  account_status: "active" | "disabled";
  must_change_password: boolean;
  failed_login_attempts: number;
  locked_until: Date | null;
  created_at: Date;
  last_login_at: Date | null;
  creator_first_name: string | null;
  creator_last_name: string | null;
}

const employeeSelect = `SELECT employees.id, employees.first_name, employees.last_name,
    employees.email, employees.role, employees.account_status, employees.must_change_password,
    employees.failed_login_attempts, employees.locked_until, employees.created_at,
    employees.last_login_at, creators.first_name AS creator_first_name,
    creators.last_name AS creator_last_name
  FROM users employees
  LEFT JOIN users creators ON creators.id = employees.created_by`;

const toEmployee = (row: EmployeeRow): Employee => ({
  id: row.id,
  firstName: row.first_name,
  lastName: row.last_name,
  fullName: `${row.first_name} ${row.last_name}`,
  email: row.email,
  role: row.role,
  status: row.account_status === "active" ? "Active" : "Disabled",
  mustChangePassword: row.must_change_password,
  failedLoginAttempts: row.failed_login_attempts,
  lockedUntil: row.locked_until?.toISOString() ?? null,
  isLocked: Boolean(row.locked_until && row.locked_until.getTime() > Date.now()),
  createdAt: row.created_at.toISOString(),
  lastLoginAt: row.last_login_at?.toISOString() ?? null,
  createdBy: row.creator_first_name && row.creator_last_name
    ? `${row.creator_first_name} ${row.creator_last_name}`
    : null,
});

const getEmployeeById = async (employeeId: number): Promise<Employee> => {
  const result = await query<EmployeeRow>(
    `${employeeSelect}
     WHERE employees.id = $1
     LIMIT 1`,
    [employeeId],
  );
  if (!result.rowCount) throw new EmployeeServiceError("Employee account not found.", 404);
  return toEmployee(result.rows[0]);
};

export const getEmployees = async (filters: EmployeeFilters): Promise<Employee[]> => {
  const result = await query<EmployeeRow>(
    `${employeeSelect}
     WHERE ($1::text IS NULL OR CONCAT_WS(' ', employees.first_name, employees.last_name, employees.email) ILIKE '%' || $1 || '%')
       AND ($2::text IS NULL OR employees.role = $2)
       AND ($3::text IS NULL OR employees.account_status = LOWER($3))
     ORDER BY employees.created_at DESC, employees.id DESC
     LIMIT 200`,
    [filters.query || null, filters.role || null, filters.status || null],
  );
  return result.rows.map(toEmployee);
};

export const createEmployee = async (
  creatorId: number,
  input: CreateEmployeeInput,
): Promise<Employee> => {
  const email = input.email.trim().toLowerCase();
  const existing = await query<{ id: number }>("SELECT id FROM users WHERE email = $1 LIMIT 1", [email]);
  if (existing.rowCount) throw new EmployeeServiceError("Email already exists.", 409);

  const passwordHash = await hashPassword(input.password);
  try {
    const result = await query<{ id: number }>(
      `INSERT INTO users (first_name, last_name, email, password_hash, role, account_status, created_by, must_change_password)
       VALUES ($1, $2, $3, $4, $5, 'active', $6, TRUE)
       RETURNING id`,
      [input.firstName.trim(), input.lastName.trim(), email, passwordHash, input.role, creatorId],
    );
    return await getEmployeeById(result.rows[0].id);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      throw new EmployeeServiceError("Email already exists.", 409);
    }
    throw error;
  }
};

const ensureModifiableEmployee = async (employeeId: number, actorId: number) => {
  if (employeeId === actorId) {
    throw new EmployeeServiceError("You cannot modify your own SystemAdmin account here.", 400);
  }
  const result = await query<{ role: "SystemAdmin" | EmployeeRole }>(
    "SELECT role FROM users WHERE id = $1 LIMIT 1",
    [employeeId],
  );
  if (!result.rowCount) throw new EmployeeServiceError("Employee account not found.", 404);
  if (result.rows[0].role === "SystemAdmin") {
    throw new EmployeeServiceError("SystemAdmin accounts are protected from employee-page changes.", 400);
  }
};

export const updateEmployeeStatus = async (
  employeeId: number,
  actorId: number,
  status: EmployeeStatus,
): Promise<Employee> => {
  await ensureModifiableEmployee(employeeId, actorId);
  await query(
    `UPDATE users
     SET account_status = $1::varchar,
         token_version = token_version + CASE WHEN $1::varchar = 'disabled'::varchar THEN 1 ELSE 0 END,
         updated_at = NOW()
     WHERE id = $2`,
    [status.toLowerCase(), employeeId],
  );
  return getEmployeeById(employeeId);
};

export const updateEmployeeRole = async (
  employeeId: number,
  actorId: number,
  role: EmployeeRole,
): Promise<Employee> => {
  await ensureModifiableEmployee(employeeId, actorId);
  await query(
    `UPDATE users
     SET role = $1,
         updated_at = NOW()
     WHERE id = $2`,
    [role, employeeId],
  );
  return getEmployeeById(employeeId);
};

export const resetEmployeePassword = async (
  employeeId: number,
  actorId: number,
  input: ResetEmployeePasswordInput,
): Promise<Employee> => {
  await ensureModifiableEmployee(employeeId, actorId);
  const passwordHash = await hashPassword(input.password);
  await query(
    `UPDATE users
     SET password_hash = $1,
         must_change_password = TRUE,
         token_version = token_version + 1,
         reset_token = NULL,
         reset_token_expires = NULL,
         failed_login_attempts = 0,
         last_failed_login_at = NULL,
         locked_until = NULL,
         updated_at = NOW()
     WHERE id = $2`,
    [passwordHash, employeeId],
  );
  return getEmployeeById(employeeId);
};

export const revokeEmployeeSessions = async (
  employeeId: number,
  actorId: number,
): Promise<Employee> => {
  await ensureModifiableEmployee(employeeId, actorId);
  await query(
    `UPDATE users
     SET token_version = token_version + 1,
         updated_at = NOW()
     WHERE id = $1`,
    [employeeId],
  );
  return getEmployeeById(employeeId);
};

export const unlockEmployeeAccount = async (
  employeeId: number,
  actorId: number,
): Promise<Employee> => {
  await ensureModifiableEmployee(employeeId, actorId);
  await query(
    `UPDATE users
     SET failed_login_attempts = 0,
         last_failed_login_at = NULL,
         locked_until = NULL,
         updated_at = NOW()
     WHERE id = $1`,
    [employeeId],
  );
  return getEmployeeById(employeeId);
};
