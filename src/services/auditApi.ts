import { AuditLogFilters, AuditLogsResponse } from "../types/audit.types";
import { apiRequest, bearerHeaders } from "./apiClient";

export const getAuditLogs = (token: string, filters: AuditLogFilters = {}) => {
  const query = new URLSearchParams();
  if (filters.query?.trim()) query.set("q", filters.query.trim());
  if (filters.action) query.set("action", filters.action);
  if (filters.outcome) query.set("outcome", filters.outcome);
  if (filters.fromDate) query.set("fromDate", filters.fromDate);
  if (filters.toDate) query.set("toDate", filters.toDate);
  const encoded = query.toString();

  return apiRequest<AuditLogsResponse>(`/api/audit-logs${encoded ? `?${encoded}` : ""}`, {
    headers: bearerHeaders(token),
  });
};

