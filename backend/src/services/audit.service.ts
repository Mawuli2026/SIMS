import { Request } from "express";
import { query } from "../config/db";
import { AuditEventInput, AuditLog, AuditLogFilters, AuditOutcome } from "../types/audit.types";

interface AuditLogRow {
  id: string;
  actor_user_id: number | null;
  actor_name: string | null;
  actor_email: string | null;
  target_user_id: number | null;
  target_name: string | null;
  target_email: string | null;
  action: AuditLog["action"];
  entity_type: string;
  entity_id: string | null;
  outcome: AuditOutcome;
  details: AuditLog["details"];
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

export const getAuditRequestContext = (request: Request) => ({
  ipAddress: (request.ip || request.socket?.remoteAddress || "unknown").slice(0, 64),
  userAgent: (typeof request.get === "function" ? request.get("user-agent") : undefined)?.slice(0, 500),
});

// Audit storage must never turn a successful business mutation into a failed response.
export const recordAuditEvent = async (event: AuditEventInput): Promise<void> => {
  try {
    await query(
      `INSERT INTO audit_logs
         (actor_user_id, target_user_id, action, entity_type, entity_id, outcome, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)`,
      [
        event.actorUserId ?? null,
        event.targetUserId ?? null,
        event.action,
        event.entityType,
        event.entityId === undefined || event.entityId === null ? null : String(event.entityId),
        event.outcome,
        JSON.stringify(event.details ?? {}),
        event.ipAddress ?? null,
        event.userAgent ?? null,
      ],
    );
  } catch (error) {
    console.error("Audit event could not be stored:", error instanceof Error ? error.message : "Unknown database error.");
  }
};

const toAuditLog = (row: AuditLogRow): AuditLog => ({
  id: Number(row.id),
  actorUserId: row.actor_user_id,
  actorName: row.actor_name,
  actorEmail: row.actor_email,
  targetUserId: row.target_user_id,
  targetName: row.target_name,
  targetEmail: row.target_email,
  action: row.action,
  entityType: row.entity_type,
  entityId: row.entity_id,
  outcome: row.outcome,
  details: row.details,
  ipAddress: row.ip_address,
  userAgent: row.user_agent,
  createdAt: row.created_at.toISOString(),
});

export const getAuditLogs = async (filters: AuditLogFilters): Promise<AuditLog[]> => {
  const result = await query<AuditLogRow>(
    `SELECT logs.id, logs.actor_user_id,
            CASE WHEN actors.id IS NULL THEN NULL ELSE CONCAT_WS(' ', actors.first_name, actors.last_name) END AS actor_name,
            actors.email AS actor_email,
            logs.target_user_id,
            CASE WHEN targets.id IS NULL THEN NULL ELSE CONCAT_WS(' ', targets.first_name, targets.last_name) END AS target_name,
            targets.email AS target_email,
            logs.action, logs.entity_type, logs.entity_id, logs.outcome, logs.details,
            logs.ip_address, logs.user_agent, logs.created_at
     FROM audit_logs logs
     LEFT JOIN users actors ON actors.id = logs.actor_user_id
     LEFT JOIN users targets ON targets.id = logs.target_user_id
     WHERE ($1::text IS NULL OR CONCAT_WS(' ', logs.action, logs.entity_type, logs.entity_id,
                                          actors.first_name, actors.last_name, actors.email,
                                          targets.first_name, targets.last_name, targets.email) ILIKE '%' || $1 || '%')
       AND ($2::text IS NULL OR logs.action = $2)
       AND ($3::text IS NULL OR logs.outcome = $3)
       AND ($4::date IS NULL OR logs.created_at >= $4::date)
       AND ($5::date IS NULL OR logs.created_at < $5::date + INTERVAL '1 day')
     ORDER BY logs.created_at DESC, logs.id DESC
     LIMIT 200`,
    [filters.query || null, filters.action || null, filters.outcome || null, filters.fromDate || null, filters.toDate || null],
  );
  return result.rows.map(toAuditLog);
};
