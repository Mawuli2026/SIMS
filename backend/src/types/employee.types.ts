export type EmployeeRole = "Manager" | "Cashier";
export type EmployeeStatus = "Active" | "Disabled";

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: "SystemAdmin" | EmployeeRole;
  status: EmployeeStatus;
  mustChangePassword: boolean;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  isLocked: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  createdBy: string | null;
}

export interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  email: string;
  role: EmployeeRole;
  password: string;
  confirmPassword: string;
}

export interface EmployeeFilters {
  query?: string;
  role?: "SystemAdmin" | EmployeeRole;
  status?: EmployeeStatus;
}

export interface ResetEmployeePasswordInput {
  password: string;
  confirmPassword: string;
}
