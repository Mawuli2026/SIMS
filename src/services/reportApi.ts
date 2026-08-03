import { ReportResponse } from "../types/report.types";
import { apiRequest, bearerHeaders } from "./apiClient";

export const getReport = (token: string, fromDate = "", toDate = "") => {
  const query = new URLSearchParams();
  if (fromDate) query.set("fromDate", fromDate);
  if (toDate) query.set("toDate", toDate);
  const suffix = query.size ? `?${query.toString()}` : "";

  return apiRequest<ReportResponse>(`/api/reports${suffix}`, {
    headers: bearerHeaders(token),
  });
};
