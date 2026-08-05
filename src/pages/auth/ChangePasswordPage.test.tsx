import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from "../../utils/authSession";
import ChangePasswordPage from "./ChangePasswordPage";

const apiUser = {
  id: 2,
  firstName: "Marcus",
  lastName: "Cole",
  email: "marcus@example.com",
  role: "Cashier" as const,
  mustChangePassword: false,
  createdAt: "2026-08-02T10:00:00.000Z",
};

describe("ChangePasswordPage", () => {
  beforeEach(() => {
    localStorage.setItem(AUTH_TOKEN_KEY, "temporary-token");
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify({
      id: 2, firstName: "Marcus", lastName: "Cole", fullName: "Marcus Cole",
      email: "marcus@example.com", role: "Cashier", mustChangePassword: true,
      dateJoined: "8/2/2026", initial: "M",
    }));
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: "Password changed successfully.", token: "rotated-token", user: apiUser }),
    } as Response);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
  });

  it("replaces the temporary password and clears the forced-change session state", async () => {
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={["/change-password"]}><Routes>
      <Route path="/change-password" element={<ChangePasswordPage />} />
      <Route path="/dashboard" element={<p>Dashboard available</p>} />
    </Routes></MemoryRouter>);

    expect(screen.getByRole("status")).toHaveTextContent("Password change is required");
    await user.type(screen.getByLabelText("Current password", { selector: "input" }), "Temporary123!");
    await user.type(screen.getByLabelText("New password", { selector: "input" }), "PrivatePassword456!");
    await user.type(screen.getByLabelText("Confirm new password", { selector: "input" }), "PrivatePassword456!");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(await screen.findByText("Dashboard available")).toBeInTheDocument();
    await waitFor(() => expect(localStorage.getItem(AUTH_USER_KEY)).toContain('"mustChangePassword":false'));
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe("rotated-token");
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/auth/change-password"), expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ Authorization: "Bearer temporary-token" }),
      body: JSON.stringify({ currentPassword: "Temporary123!", newPassword: "PrivatePassword456!", confirmPassword: "PrivatePassword456!" }),
    }));
  });

  it("shows the backend error when the current password is incorrect", async () => {
    jest.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: "Current password is incorrect." }),
    } as Response);
    const user = userEvent.setup();
    render(<MemoryRouter><ChangePasswordPage /></MemoryRouter>);

    await user.type(screen.getByLabelText("Current password", { selector: "input" }), "Incorrect123!");
    await user.type(screen.getByLabelText("New password", { selector: "input" }), "PrivatePassword456!");
    await user.type(screen.getByLabelText("Confirm new password", { selector: "input" }), "PrivatePassword456!");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Current password is incorrect.");
  });
});
