import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Employee } from "../../../types/employee.types";
import { AUTH_TOKEN_KEY } from "../../../utils/authSession";
import EmployeeManagement from "./EmployeeManagement";

const systemAdmin: Employee = {
  id: 1,
  firstName: "System",
  lastName: "Administrator",
  fullName: "System Administrator",
  email: "system-admin@example.com",
  role: "SystemAdmin",
  status: "Active",
  mustChangePassword: false,
  failedLoginAttempts: 0,
  lockedUntil: null,
  isLocked: false,
  createdAt: "2026-08-01T10:00:00.000Z",
  lastLoginAt: "2026-08-03T10:00:00.000Z",
  createdBy: null,
};

const manager: Employee = {
  id: 2,
  firstName: "Marcus",
  lastName: "Cole",
  fullName: "Marcus Cole",
  email: "marcus@example.com",
  role: "Manager",
  status: "Active",
  mustChangePassword: true,
  failedLoginAttempts: 0,
  lockedUntil: null,
  isLocked: false,
  createdAt: "2026-08-02T10:00:00.000Z",
  lastLoginAt: null,
  createdBy: "System Administrator",
};

const response = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
}) as Response;

describe("EmployeeManagement", () => {
  beforeEach(() => {
    localStorage.setItem(AUTH_TOKEN_KEY, "system-token");
    jest.spyOn(global, "fetch").mockResolvedValue(response({ employees: [systemAdmin, manager] }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
  });

  it("loads employees and protects the SystemAdmin row", async () => {
    render(<EmployeeManagement />);

    expect(await screen.findByText("system-admin@example.com")).toBeInTheDocument();
    expect(screen.getByText("Marcus Cole")).toBeInTheDocument();
    expect(screen.getByText("Protected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Disable" })).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/employees"), expect.objectContaining({
      headers: expect.objectContaining({ Authorization: "Bearer system-token" }),
    }));
  });

  it("creates only Manager or Cashier accounts through the protected API", async () => {
    let created = false;
    const newEmployee: Employee = { ...manager, id: 3, firstName: "Esi", lastName: "Mensah", fullName: "Esi Mensah", email: "esi@example.com", role: "Cashier" };
    (fetch as jest.Mock).mockImplementation(async (_input: RequestInfo | URL, options?: RequestInit) => {
      if (options?.method === "POST") {
        created = true;
        return response({ message: "Employee account created successfully.", employee: newEmployee }, 201);
      }
      return response({ employees: created ? [systemAdmin, manager, newEmployee] : [systemAdmin, manager] });
    });
    const user = userEvent.setup();
    render(<EmployeeManagement />);
    await screen.findByText("Marcus Cole");
    await user.click(screen.getByRole("button", { name: /add employee/i }));

    const dialog = screen.getByRole("dialog", { name: "Add Employee" });
    expect(within(dialog).queryByRole("option", { name: "SystemAdmin" })).not.toBeInTheDocument();
    await user.type(within(dialog).getByLabelText("First name"), "Esi");
    await user.type(within(dialog).getByLabelText("Last name"), "Mensah");
    await user.type(within(dialog).getByLabelText("Email address"), "esi@example.com");
    await user.type(within(dialog).getByLabelText("Temporary password"), "Temporary123!");
    await user.type(within(dialog).getByLabelText("Confirm temporary password"), "Temporary123!");
    await user.click(within(dialog).getByRole("button", { name: "Create Employee" }));

    expect(await screen.findByText("Esi Mensah")).toBeInTheDocument();
    const postCall = (fetch as jest.Mock).mock.calls.find(([, options]) => options?.method === "POST");
    expect(postCall?.[1]).toEqual(expect.objectContaining({
      body: JSON.stringify({ firstName: "Esi", lastName: "Mensah", email: "esi@example.com", role: "Cashier", password: "Temporary123!", confirmPassword: "Temporary123!" }),
    }));
  });

  it("changes an employee role and account status", async () => {
    let current = manager;
    (fetch as jest.Mock).mockImplementation(async (input: RequestInfo | URL, options?: RequestInit) => {
      const url = String(input);
      if (options?.method === "PATCH" && url.includes("/role")) {
        current = { ...current, role: "Cashier" };
        return response({ message: "Employee role updated successfully.", employee: current });
      }
      if (options?.method === "PATCH" && url.includes("/status")) {
        current = { ...current, status: "Disabled" };
        return response({ message: "Employee account disabled successfully.", employee: current });
      }
      return response({ employees: [systemAdmin, current] });
    });
    const user = userEvent.setup();
    render(<EmployeeManagement />);
    await screen.findByText("Marcus Cole");

    await user.selectOptions(screen.getByLabelText("Role for Marcus Cole"), "Cashier");
    await waitFor(() => expect(screen.getByLabelText("Role for Marcus Cole")).toHaveValue("Cashier"));
    await user.click(screen.getByRole("button", { name: "Disable" }));
    expect(await screen.findByRole("button", { name: "Enable" })).toBeInTheDocument();
  });

  it("lets SystemAdmin set a replacement temporary password", async () => {
    let current = { ...manager, mustChangePassword: false };
    (fetch as jest.Mock).mockImplementation(async (input: RequestInfo | URL, options?: RequestInit) => {
      const url = String(input);
      if (options?.method === "PATCH" && url.includes("/password")) {
        current = { ...current, mustChangePassword: true };
        return response({ message: "Temporary password set successfully. The employee must change it at next sign-in.", employee: current });
      }
      return response({ employees: [systemAdmin, current] });
    });
    const user = userEvent.setup();
    render(<EmployeeManagement />);
    await screen.findByText("Marcus Cole");
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    const dialog = screen.getByRole("dialog", { name: "Reset password" });
    await user.type(within(dialog).getByLabelText("New temporary password"), "Replacement456!");
    await user.type(within(dialog).getByLabelText("Confirm new temporary password"), "Replacement456!");
    await user.click(within(dialog).getByRole("button", { name: "Set Temporary Password" }));

    expect(await screen.findByText("Password change required")).toBeInTheDocument();
    const passwordCall = (fetch as jest.Mock).mock.calls.find(([input, options]) => String(input).includes("/password") && options?.method === "PATCH");
    expect(passwordCall?.[1]).toEqual(expect.objectContaining({
      body: JSON.stringify({ password: "Replacement456!", confirmPassword: "Replacement456!" }),
    }));
  });

  it("lets SystemAdmin force an employee logout", async () => {
    (fetch as jest.Mock).mockImplementation(async (input: RequestInfo | URL, options?: RequestInit) => {
      const url = String(input);
      if (options?.method === "PATCH" && url.includes("/revoke-sessions")) {
        return response({ message: "All employee sessions were revoked successfully.", employee: manager });
      }
      return response({ employees: [systemAdmin, manager] });
    });
    const user = userEvent.setup();
    render(<EmployeeManagement />);
    await screen.findByText("Marcus Cole");

    await user.click(screen.getByRole("button", { name: "Force logout" }));

    expect(await screen.findByText("All employee sessions were revoked successfully.")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/employees/2/revoke-sessions"), expect.objectContaining({
      method: "PATCH",
      headers: expect.objectContaining({ Authorization: "Bearer system-token" }),
    }));
  });

  it("shows and clears a locked employee account", async () => {
    let current: Employee = { ...manager, failedLoginAttempts: 5, lockedUntil: "2026-08-03T12:00:00.000Z", isLocked: true };
    (fetch as jest.Mock).mockImplementation(async (input: RequestInfo | URL, options?: RequestInit) => {
      const url = String(input);
      if (options?.method === "PATCH" && url.includes("/unlock")) {
        current = { ...current, failedLoginAttempts: 0, lockedUntil: null, isLocked: false };
        return response({ message: "Employee account unlocked successfully.", employee: current });
      }
      return response({ employees: [systemAdmin, current] });
    });
    const user = userEvent.setup();
    render(<EmployeeManagement />);

    expect(await screen.findByText("Login locked")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Unlock" }));

    expect(await screen.findByText("Employee account unlocked successfully.")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Login locked")).not.toBeInTheDocument());
  });
});
