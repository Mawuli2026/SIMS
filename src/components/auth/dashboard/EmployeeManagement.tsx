import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  createEmployee,
  getEmployees,
  resetEmployeePassword,
  revokeEmployeeSessions,
  unlockEmployeeAccount,
  updateEmployeeRole,
  updateEmployeeStatus,
} from "../../../services/employeeApi";
import {
  CreateEmployeeRequest,
  Employee,
  EmployeeRole,
  EmployeeStatus,
  ResetEmployeePasswordRequest,
} from "../../../types/employee.types";
import { getAuthToken } from "../../../utils/authSession";

const emptyForm: CreateEmployeeRequest = {
  firstName: "",
  lastName: "",
  email: "",
  role: "Cashier",
  password: "",
  confirmPassword: "",
};

const emptyPasswordForm: ResetEmployeePasswordRequest = { password: "", confirmPassword: "" };

const formatDate = (value: string | null) => {
  if (!value) return "Never";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"" | Employee["role"]>("");
  const [statusFilter, setStatusFilter] = useState<"" | EmployeeStatus>("");
  const [isLoading, setIsLoading] = useState(true);
  const [requestError, setRequestError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateEmployeeRequest>(emptyForm);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [pendingEmployeeId, setPendingEmployeeId] = useState<number | null>(null);
  const [passwordEmployee, setPasswordEmployee] = useState<Employee | null>(null);
  const [passwordForm, setPasswordForm] = useState<ResetEmployeePasswordRequest>(emptyPasswordForm);
  const [passwordError, setPasswordError] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const loadEmployees = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setRequestError("Your session is no longer available. Please sign in again.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setRequestError("");
    try {
      const response = await getEmployees(token, { query, role: roleFilter, status: statusFilter });
      setEmployees(response.employees);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Unable to load employees.");
    } finally {
      setIsLoading(false);
    }
  }, [query, roleFilter, statusFilter]);

  useEffect(() => { void loadEmployees(); }, [loadEmployees]);

  const openForm = () => {
    setForm(emptyForm);
    setFormError("");
    setSuccessMessage("");
    setShowForm(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (form.password.length < 12) return setFormError("Temporary password must be at least 12 characters.");
    if (form.password !== form.confirmPassword) return setFormError("Passwords do not match.");
    const token = getAuthToken();
    if (!token) return setFormError("Your session is no longer available. Please sign in again.");

    setIsSaving(true);
    setFormError("");
    try {
      const response = await createEmployee(token, form);
      setShowForm(false);
      setSuccessMessage(response.message);
      await loadEmployees();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to create employee account.");
    } finally {
      setIsSaving(false);
    }
  };

  const changeStatus = async (employee: Employee) => {
    const token = getAuthToken();
    if (!token) return setRequestError("Your session is no longer available. Please sign in again.");
    const nextStatus: EmployeeStatus = employee.status === "Active" ? "Disabled" : "Active";
    setPendingEmployeeId(employee.id);
    setRequestError("");
    setSuccessMessage("");
    try {
      const response = await updateEmployeeStatus(token, employee.id, nextStatus);
      setSuccessMessage(response.message);
      await loadEmployees();
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Unable to update employee status.");
    } finally {
      setPendingEmployeeId(null);
    }
  };

  const changeRole = async (employee: Employee, role: EmployeeRole) => {
    if (employee.role === role) return;
    const token = getAuthToken();
    if (!token) return setRequestError("Your session is no longer available. Please sign in again.");
    setPendingEmployeeId(employee.id);
    setRequestError("");
    setSuccessMessage("");
    try {
      const response = await updateEmployeeRole(token, employee.id, role);
      setSuccessMessage(response.message);
      await loadEmployees();
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Unable to update employee role.");
    } finally {
      setPendingEmployeeId(null);
    }
  };

  const forceLogout = async (employee: Employee) => {
    const token = getAuthToken();
    if (!token) return setRequestError("Your session is no longer available. Please sign in again.");
    setPendingEmployeeId(employee.id);
    setRequestError("");
    setSuccessMessage("");
    try {
      const response = await revokeEmployeeSessions(token, employee.id);
      setSuccessMessage(response.message);
      await loadEmployees();
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Unable to revoke employee sessions.");
    } finally {
      setPendingEmployeeId(null);
    }
  };

  const unlockAccount = async (employee: Employee) => {
    const token = getAuthToken();
    if (!token) return setRequestError("Your session is no longer available. Please sign in again.");
    setPendingEmployeeId(employee.id);
    setRequestError("");
    setSuccessMessage("");
    try {
      const response = await unlockEmployeeAccount(token, employee.id);
      setSuccessMessage(response.message);
      await loadEmployees();
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Unable to unlock employee account.");
    } finally {
      setPendingEmployeeId(null);
    }
  };

  const openPasswordReset = (employee: Employee) => {
    setPasswordEmployee(employee);
    setPasswordForm(emptyPasswordForm);
    setPasswordError("");
    setSuccessMessage("");
  };

  const handlePasswordReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!passwordEmployee) return;
    if (passwordForm.password.length < 12) return setPasswordError("Temporary password must be at least 12 characters.");
    if (passwordForm.password !== passwordForm.confirmPassword) return setPasswordError("Passwords do not match.");
    const token = getAuthToken();
    if (!token) return setPasswordError("Your session is no longer available. Please sign in again.");

    setIsResettingPassword(true);
    setPasswordError("");
    try {
      const response = await resetEmployeePassword(token, passwordEmployee.id, passwordForm);
      setPasswordEmployee(null);
      setSuccessMessage(response.message);
      await loadEmployees();
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Unable to reset the employee password.");
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div>
      <div className="page-header product-page-header">
        <div><h1>Employee Management</h1><p>Create and manage Manager and Cashier access without deleting historical employee records.</p></div>
        <button className="primary-button" type="button" onClick={openForm}>+ Add Employee</button>
      </div>

      <section className="dashboard-panel">
        <div className="employee-toolbar">
          <input aria-label="Search employees" placeholder="Search by name or email..." value={query} onChange={(event) => setQuery(event.target.value)} />
          <select aria-label="Filter employees by role" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as "" | Employee["role"])}>
            <option value="">All roles</option><option value="SystemAdmin">SystemAdmin</option><option value="Manager">Manager</option><option value="Cashier">Cashier</option>
          </select>
          <select aria-label="Filter employees by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "" | EmployeeStatus)}>
            <option value="">All statuses</option><option value="Active">Active</option><option value="Disabled">Disabled</option>
          </select>
          <span className="product-count">{employees.length} employee{employees.length === 1 ? "" : "s"}</span>
        </div>

        {successMessage && <p className="employee-success" role="status">{successMessage}</p>}
        {requestError && <div className="product-request-error" role="alert"><span>{requestError}</span>
          <button className="secondary-button" type="button" onClick={() => void loadEmployees()}>Retry</button></div>}

        {isLoading ? <p className="product-loading" role="status">Loading employees...</p> : <div className="table-scroll">
          <table className="dashboard-table employee-table">
            <thead><tr><th>Employee</th><th>Role</th><th>Status</th><th>Created</th><th>Last Login</th><th>Created By</th><th>Actions</th></tr></thead>
            <tbody>
              {employees.map((employee) => {
                const isProtected = employee.role === "SystemAdmin";
                const isPending = pendingEmployeeId === employee.id;
                return <tr key={employee.id}>
                  <td><strong>{employee.fullName}</strong><small className="stock-available">{employee.email}</small></td>
                  <td>{isProtected ? <strong>SystemAdmin</strong> : <select aria-label={`Role for ${employee.fullName}`} disabled={isPending} value={employee.role} onChange={(event) => void changeRole(employee, event.target.value as EmployeeRole)}><option value="Manager">Manager</option><option value="Cashier">Cashier</option></select>}</td>
                  <td><span className={employee.status === "Active" ? "badge-success" : "badge-muted"}>{employee.status}</span>{employee.isLocked && <small className="account-locked">Login locked</small>}{employee.mustChangePassword && <small className="password-change-required">Password change required</small>}</td>
                  <td>{formatDate(employee.createdAt)}</td><td>{formatDate(employee.lastLoginAt)}</td><td>{employee.createdBy ?? "Bootstrap"}</td>
                  <td>{isProtected ? <span className="protected-account">Protected</span> : <div className="table-actions"><button className="secondary-action" type="button" disabled={isPending} onClick={() => openPasswordReset(employee)}>Reset password</button><button className="warning-action" type="button" disabled={isPending} onClick={() => void forceLogout(employee)}>Force logout</button>{employee.isLocked && <button className="success-action" type="button" disabled={isPending} onClick={() => void unlockAccount(employee)}>Unlock</button>}<button className={employee.status === "Active" ? "danger-action" : "success-action"} type="button" disabled={isPending} onClick={() => void changeStatus(employee)}>{isPending ? "Updating..." : employee.status === "Active" ? "Disable" : "Enable"}</button></div>}</td>
                </tr>;
              })}
              {employees.length === 0 && <tr><td colSpan={7} className="empty-table">No employees match these filters.</td></tr>}
            </tbody>
          </table>
        </div>}
      </section>

      {showForm && <div className="modal-backdrop" role="presentation">
        <div className="product-modal" role="dialog" aria-modal="true" aria-labelledby="employee-form-title">
          <div className="modal-header"><h2 id="employee-form-title">Add Employee</h2><button type="button" disabled={isSaving} onClick={() => setShowForm(false)} aria-label="Close employee form">&times;</button></div>
          <form className="product-form" onSubmit={(event) => void handleSubmit(event)}>
            <div className="form-grid">
              <label>First name<input required maxLength={100} value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></label>
              <label>Last name<input required maxLength={100} value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></label>
            </div>
            <label>Email address<input required type="email" maxLength={150} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
            <label>Role<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as EmployeeRole })}><option value="Cashier">Cashier</option><option value="Manager">Manager</option></select></label>
            <label>Temporary password<input required type="password" minLength={12} maxLength={128} autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
            <label>Confirm temporary password<input required type="password" minLength={12} maxLength={128} autoComplete="new-password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} /></label>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <div className="form-actions"><button type="button" className="secondary-button" disabled={isSaving} onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="primary-button" disabled={isSaving}>{isSaving ? "Creating..." : "Create Employee"}</button></div>
          </form>
        </div>
      </div>}

      {passwordEmployee && <div className="modal-backdrop" role="presentation">
        <div className="product-modal" role="dialog" aria-modal="true" aria-labelledby="employee-password-title">
          <div className="modal-header"><h2 id="employee-password-title">Reset password</h2><button type="button" disabled={isResettingPassword} onClick={() => setPasswordEmployee(null)} aria-label="Close password reset form">&times;</button></div>
          <form className="product-form" onSubmit={(event) => void handlePasswordReset(event)}>
            <p>Set a temporary password for <strong>{passwordEmployee.fullName}</strong>. They must replace it before accessing SIMS.</p>
            <label>New temporary password<input required type="password" minLength={12} maxLength={128} autoComplete="new-password" value={passwordForm.password} onChange={(event) => setPasswordForm({ ...passwordForm, password: event.target.value })} /></label>
            <label>Confirm new temporary password<input required type="password" minLength={12} maxLength={128} autoComplete="new-password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })} /></label>
            {passwordError && <p className="form-error" role="alert">{passwordError}</p>}
            <div className="form-actions"><button type="button" className="secondary-button" disabled={isResettingPassword} onClick={() => setPasswordEmployee(null)}>Cancel</button><button type="submit" className="primary-button" disabled={isResettingPassword}>{isResettingPassword ? "Resetting..." : "Set Temporary Password"}</button></div>
          </form>
        </div>
      </div>}
    </div>
  );
};

export default EmployeeManagement;
