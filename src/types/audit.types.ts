export type AuditOutcome = "success" | "failure";

export const auditActions = [
  "AUTH_LOGIN_SUCCESS",
  "AUTH_LOGIN_FAILURE",
  "AUTH_ACCOUNT_LOCKED",
  "AUTH_LOGIN_RATE_LIMITED",
  "AUTH_PASSWORD_RESET_REQUESTED",
  "AUTH_PASSWORD_RESET_COMPLETED",
  "AUTH_PASSWORD_CHANGED",
  "EMPLOYEE_CREATED",
  "EMPLOYEE_STATUS_CHANGED",
  "EMPLOYEE_ROLE_CHANGED",
  "EMPLOYEE_PASSWORD_RESET",
  "EMPLOYEE_SESSIONS_REVOKED",
  "EMPLOYEE_ACCOUNT_UNLOCKED",
  "PRODUCT_CREATED",
  "PRODUCT_UPDATED",
  "PRODUCT_STATUS_CHANGED",
  "SALE_COMPLETED",
] as const;

export type AuditAction = typeof auditActions[number];

export interface AuditLog {
  id: number;
  actorUserId: number | null;
  actorName: string | null;
  actorEmail: string | null;
  targetUserId: number | null;
  targetName: string | null;
  targetEmail: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  outcome: AuditOutcome;
  details: Record<string, string | number | boolean | null>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditLogFilters {
  query?: string;
  action?: AuditAction | "";
  outcome?: AuditOutcome | "";
  fromDate?: string;
  toDate?: string;
}

export interface AuditLogsResponse {
  auditLogs: AuditLog[];
}

