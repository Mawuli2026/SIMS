import {
  CreateEmployeeRequest,
  EmployeeResponse,
  EmployeeRole,
  EmployeesResponse,
  EmployeeStatus,
  ResetEmployeePasswordRequest,
} from "../types/employee.types";
import { apiRequest, bearerHeaders } from "./apiClient";

interface EmployeeFilters {
  query?: string;
  role?: "SystemAdmin" | EmployeeRole | "";
  status?: EmployeeStatus | "";
}

export const getEmployees = (token: string, filters: EmployeeFilters = {}) => {
  const query = new URLSearchParams();
  if (filters.query?.trim()) query.set("q", filters.query.trim());
  if (filters.role) query.set("role", filters.role);
  if (filters.status) query.set("status", filters.status);
  const encoded = query.toString();

  return apiRequest<EmployeesResponse>(`/api/employees${encoded ? `?${encoded}` : ""}`, {
    headers: bearerHeaders(token),
  });
};

export const createEmployee = (token: string, values: CreateEmployeeRequest) => apiRequest<EmployeeResponse>("/api/employees", {
  method: "POST",
  headers: bearerHeaders(token),
  body: JSON.stringify(values),
});

export const updateEmployeeStatus = (token: string, employeeId: number, status: EmployeeStatus) =>
  apiRequest<EmployeeResponse>(`/api/employees/${employeeId}/status`, {
    method: "PATCH",
    headers: bearerHeaders(token),
    body: JSON.stringify({ status }),
  });

export const updateEmployeeRole = (token: string, employeeId: number, role: EmployeeRole) =>
  apiRequest<EmployeeResponse>(`/api/employees/${employeeId}/role`, {
    method: "PATCH",
    headers: bearerHeaders(token),
    body: JSON.stringify({ role }),
  });

export const resetEmployeePassword = (token: string, employeeId: number, values: ResetEmployeePasswordRequest) =>
  apiRequest<EmployeeResponse>(`/api/employees/${employeeId}/password`, {
    method: "PATCH",
    headers: bearerHeaders(token),
    body: JSON.stringify(values),
  });

export const revokeEmployeeSessions = (token: string, employeeId: number) =>
  apiRequest<EmployeeResponse>(`/api/employees/${employeeId}/revoke-sessions`, {
    method: "PATCH",
    headers: bearerHeaders(token),
  });

export const unlockEmployeeAccount = (token: string, employeeId: number) =>
  apiRequest<EmployeeResponse>(`/api/employees/${employeeId}/unlock`, {
    method: "PATCH",
    headers: bearerHeaders(token),
  });
