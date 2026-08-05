import { NextFunction, Request, Response } from "express";
import {
  createEmployee as createEmployeeRecord,
  EmployeeServiceError,
  getEmployees,
  resetEmployeePassword as resetEmployeePasswordRecord,
  revokeEmployeeSessions as revokeEmployeeSessionsRecord,
  unlockEmployeeAccount as unlockEmployeeAccountRecord,
  updateEmployeeRole as updateEmployeeRoleRecord,
  updateEmployeeStatus as updateEmployeeStatusRecord,
} from "../services/employee.service";
import { CreateEmployeeInput, ResetEmployeePasswordInput } from "../types/employee.types";
import { AuditAction } from "../types/audit.types";
import { getAuditRequestContext, recordAuditEvent } from "../services/audit.service";
import {
  createEmployeeSchema,
  employeeQuerySchema,
  employeePasswordSchema,
  employeeRoleSchema,
  employeeStatusSchema,
  firstValidationError,
} from "../utils/validation";

const parseEmployeeId = (value: string): number | null => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const handleEmployeeError = (error: unknown, response: Response, next: NextFunction) => {
  if (error instanceof EmployeeServiceError) {
    response.status(error.statusCode).json({ message: error.message });
    return;
  }
  next(error);
};

const auditEmployeeMutation = (
  request: Request,
  actorUserId: number,
  employeeId: number,
  action: AuditAction,
  details: Record<string, string | number | boolean | null> = {},
) => recordAuditEvent({
  actorUserId,
  targetUserId: employeeId,
  action,
  entityType: "employee",
  entityId: employeeId,
  outcome: "success",
  details,
  ...getAuditRequestContext(request),
});

export const listEmployees = async (request: Request, response: Response, next: NextFunction) => {
  const validation = employeeQuerySchema.safeParse(request.query);
  if (!validation.success) {
    response.status(400).json({ message: firstValidationError(validation.error) });
    return;
  }

  try {
    response.status(200).json({
      employees: await getEmployees({
        query: validation.data.q,
        role: validation.data.role,
        status: validation.data.status,
      }),
    });
  } catch (error) {
    next(error);
  }
};

export const createEmployee = async (
  request: Request<Record<string, never>, unknown, CreateEmployeeInput>,
  response: Response,
  next: NextFunction,
) => {
  if (!request.authUser) {
    response.status(401).json({ message: "Authentication token is required." });
    return;
  }
  const validation = createEmployeeSchema.safeParse(request.body);
  if (!validation.success) {
    response.status(400).json({ message: firstValidationError(validation.error) });
    return;
  }

  try {
    const employee = await createEmployeeRecord(request.authUser.id, validation.data);
    await auditEmployeeMutation(request, request.authUser.id, employee.id, "EMPLOYEE_CREATED", {
      role: employee.role,
      status: employee.status,
    });
    response.status(201).json({ message: "Employee account created successfully.", employee });
  } catch (error) {
    handleEmployeeError(error, response, next);
  }
};

export const updateEmployeeStatus = async (
  request: Request<{ employeeId: string }>,
  response: Response,
  next: NextFunction,
) => {
  if (!request.authUser) {
    response.status(401).json({ message: "Authentication token is required." });
    return;
  }
  const employeeId = parseEmployeeId(request.params.employeeId);
  if (!employeeId) {
    response.status(400).json({ message: "Employee ID must be a positive integer." });
    return;
  }
  const validation = employeeStatusSchema.safeParse(request.body);
  if (!validation.success) {
    response.status(400).json({ message: firstValidationError(validation.error) });
    return;
  }

  try {
    const employee = await updateEmployeeStatusRecord(employeeId, request.authUser.id, validation.data.status);
    await auditEmployeeMutation(request, request.authUser.id, employee.id, "EMPLOYEE_STATUS_CHANGED", {
      status: employee.status,
    });
    response.status(200).json({ message: `Employee account ${validation.data.status === "Active" ? "enabled" : "disabled"} successfully.`, employee });
  } catch (error) {
    handleEmployeeError(error, response, next);
  }
};

export const updateEmployeeRole = async (
  request: Request<{ employeeId: string }>,
  response: Response,
  next: NextFunction,
) => {
  if (!request.authUser) {
    response.status(401).json({ message: "Authentication token is required." });
    return;
  }
  const employeeId = parseEmployeeId(request.params.employeeId);
  if (!employeeId) {
    response.status(400).json({ message: "Employee ID must be a positive integer." });
    return;
  }
  const validation = employeeRoleSchema.safeParse(request.body);
  if (!validation.success) {
    response.status(400).json({ message: firstValidationError(validation.error) });
    return;
  }

  try {
    const employee = await updateEmployeeRoleRecord(employeeId, request.authUser.id, validation.data.role);
    await auditEmployeeMutation(request, request.authUser.id, employee.id, "EMPLOYEE_ROLE_CHANGED", {
      role: employee.role,
    });
    response.status(200).json({ message: "Employee role updated successfully.", employee });
  } catch (error) {
    handleEmployeeError(error, response, next);
  }
};

export const resetEmployeePassword = async (
  request: Request<{ employeeId: string }, unknown, ResetEmployeePasswordInput>,
  response: Response,
  next: NextFunction,
) => {
  if (!request.authUser) {
    response.status(401).json({ message: "Authentication token is required." });
    return;
  }
  const employeeId = parseEmployeeId(request.params.employeeId);
  if (!employeeId) {
    response.status(400).json({ message: "Employee ID must be a positive integer." });
    return;
  }
  const validation = employeePasswordSchema.safeParse(request.body);
  if (!validation.success) {
    response.status(400).json({ message: firstValidationError(validation.error) });
    return;
  }

  try {
    const employee = await resetEmployeePasswordRecord(employeeId, request.authUser.id, validation.data);
    await auditEmployeeMutation(request, request.authUser.id, employee.id, "EMPLOYEE_PASSWORD_RESET", {
      mustChangePassword: employee.mustChangePassword,
      sessionsRevoked: true,
    });
    response.status(200).json({
      message: "Temporary password set successfully. The employee must change it at next sign-in.",
      employee,
    });
  } catch (error) {
    handleEmployeeError(error, response, next);
  }
};

export const revokeEmployeeSessions = async (
  request: Request<{ employeeId: string }>,
  response: Response,
  next: NextFunction,
) => {
  if (!request.authUser) {
    response.status(401).json({ message: "Authentication token is required." });
    return;
  }
  const employeeId = parseEmployeeId(request.params.employeeId);
  if (!employeeId) {
    response.status(400).json({ message: "Employee ID must be a positive integer." });
    return;
  }

  try {
    const employee = await revokeEmployeeSessionsRecord(employeeId, request.authUser.id);
    await auditEmployeeMutation(request, request.authUser.id, employee.id, "EMPLOYEE_SESSIONS_REVOKED", {
      sessionsRevoked: true,
    });
    response.status(200).json({ message: "All employee sessions were revoked successfully.", employee });
  } catch (error) {
    handleEmployeeError(error, response, next);
  }
};

export const unlockEmployeeAccount = async (
  request: Request<{ employeeId: string }>,
  response: Response,
  next: NextFunction,
) => {
  if (!request.authUser) {
    response.status(401).json({ message: "Authentication token is required." });
    return;
  }
  const employeeId = parseEmployeeId(request.params.employeeId);
  if (!employeeId) {
    response.status(400).json({ message: "Employee ID must be a positive integer." });
    return;
  }

  try {
    const employee = await unlockEmployeeAccountRecord(employeeId, request.authUser.id);
    await auditEmployeeMutation(request, request.authUser.id, employee.id, "EMPLOYEE_ACCOUNT_UNLOCKED", {
      failedLoginAttempts: employee.failedLoginAttempts,
    });
    response.status(200).json({ message: "Employee account unlocked successfully.", employee });
  } catch (error) {
    handleEmployeeError(error, response, next);
  }
};
