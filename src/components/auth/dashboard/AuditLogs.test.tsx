import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AUTH_TOKEN_KEY } from "../../../utils/authSession";
import AuditLogs from "./AuditLogs";

const response = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
}) as Response;

const auditLog = {
  id: 1,
  actorUserId: 1,
  actorName: "System Administrator",
  actorEmail: "system-admin@example.com",
  targetUserId: 2,
  targetName: "Marcus Cole",
  targetEmail: "marcus@example.com",
  action: "EMPLOYEE_CREATED",
  entityType: "employee",
  entityId: "2",
  outcome: "success",
  details: { role: "Manager", status: "Active" },
  ipAddress: "127.0.0.1",
  userAgent: "SIMS test browser",
  createdAt: "2026-08-04T12:00:00.000Z",
};

describe("AuditLogs", () => {
  beforeEach(() => {
    localStorage.setItem(AUTH_TOKEN_KEY, "system-token");
    jest.spyOn(global, "fetch").mockResolvedValue(response({ auditLogs: [auditLog] }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
  });

  it("loads operational audit events through the authenticated API", async () => {
    render(<AuditLogs />);

    expect(await screen.findByText("System Administrator")).toBeInTheDocument();
    expect(screen.getAllByText("Employee Created").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Marcus Cole")).toBeInTheDocument();
    expect(screen.getByText(/role: Manager/i)).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/audit-logs"), expect.objectContaining({
      headers: expect.objectContaining({ Authorization: "Bearer system-token" }),
    }));
  });

  it("sends action and outcome filters to PostgreSQL API", async () => {
    const user = userEvent.setup();
    render(<AuditLogs />);
    await screen.findByText("System Administrator");

    await user.selectOptions(screen.getByLabelText("Filter audit logs by action"), "EMPLOYEE_CREATED");
    await user.selectOptions(screen.getByLabelText("Filter audit logs by outcome"), "success");

    await waitFor(() => expect(fetch).toHaveBeenLastCalledWith(
      expect.stringMatching(/\/api\/audit-logs\?.*action=EMPLOYEE_CREATED.*outcome=success/),
      expect.any(Object),
    ));
  });
});
