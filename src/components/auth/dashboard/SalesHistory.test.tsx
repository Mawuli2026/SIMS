import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import SalesHistory from "./SalesHistory";
import { UserProfile } from "../../../types/dashboard.types";
import { Sale } from "../../../types/sale.types";
import { AUTH_TOKEN_KEY } from "../../../utils/authSession";

const sales: Sale[] = [
  { id: 1, receiptNumber: "SIMS-00000001", createdAt: "2026-07-19T10:00:00.000Z", cashierName: "Alicia Ng", cashierEmail: "admin@sims.com", items: [{ productId: 1, productName: "Sugar", unitPrice: 10, quantity: 2, lineTotal: 20 }], totalAmount: 20 },
  { id: 2, receiptNumber: "SIMS-00000002", createdAt: "2026-07-18T10:00:00.000Z", cashierName: "Marcus Cole", cashierEmail: "cashier@sims.com", items: [{ productId: 3, productName: "Rice", unitPrice: 55, quantity: 1, lineTotal: 55 }], totalAmount: 55 },
];

const makeUser = (role: "SystemAdmin" | "Manager" | "Cashier"): UserProfile => {
  const isCashier = role === "Cashier";
  return { id: 1, firstName: isCashier ? "Marcus" : "Alicia", lastName: isCashier ? "Cole" : "Ng", fullName: isCashier ? "Marcus Cole" : "Alicia Ng", email: isCashier ? "cashier@sims.com" : "manager@sims.com", role, mustChangePassword: false, dateJoined: "2026-01-01", initial: isCashier ? "M" : "A" };
};

describe("SalesHistory", () => {
  beforeEach(() => {
    localStorage.setItem(AUTH_TOKEN_KEY, "sales-token");
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ sales }),
    } as Response);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
  });

  it("shows all sales to a manager and expands details", async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><SalesHistory user={makeUser("Manager")} /></MemoryRouter>);
    expect(await screen.findByText("SIMS-00000001")).toBeInTheDocument();
    expect(screen.getByText("SIMS-00000002")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: /view details/i })[0]);
    expect(screen.getByText("Transaction details")).toBeInTheDocument();
    expect(screen.getByText("$10.00")).toBeInTheDocument();
  });

  it("limits a cashier to their own sales", async () => {
    render(<MemoryRouter><SalesHistory user={makeUser("Cashier")} /></MemoryRouter>);
    expect(await screen.findByText("SIMS-00000002")).toBeInTheDocument();
    expect(screen.queryByText("SIMS-00000001")).not.toBeInTheDocument();
  });

  it("searches by product and filters the visible results", async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><SalesHistory user={makeUser("Manager")} /></MemoryRouter>);
    await screen.findByText("SIMS-00000001");
    await user.type(screen.getByLabelText(/search sales/i), "Rice");
    expect(screen.getByText("SIMS-00000002")).toBeInTheDocument();
    expect(screen.queryByText("SIMS-00000001")).not.toBeInTheDocument();
  });

  it("sends the authenticated request to the sales API", async () => {
    render(<MemoryRouter><SalesHistory user={makeUser("Manager")} /></MemoryRouter>);
    await screen.findByText("SIMS-00000001");
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/sales"), expect.objectContaining({
      headers: expect.objectContaining({ Authorization: "Bearer sales-token" }),
    }));
  });

  it("requests the next sales page and keeps summary totals from the API", async () => {
    jest.mocked(fetch).mockImplementation(async (input) => {
      const secondPage = String(input).includes("page=2");
      return {
        ok: true,
        status: 200,
        json: async () => ({
          sales: [secondPage ? sales[1] : sales[0]],
          pagination: { page: secondPage ? 2 : 1, pageSize: 20, totalItems: 21, totalPages: 2 },
          summary: { transactionCount: 21, totalValue: 875 },
        }),
      } as Response;
    });

    const user = userEvent.setup();
    render(<MemoryRouter><SalesHistory user={makeUser("Manager")} /></MemoryRouter>);
    expect(await screen.findByText("SIMS-00000001")).toBeInTheDocument();
    expect(screen.getByText("21")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(await screen.findByText("SIMS-00000002")).toBeInTheDocument();
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringContaining("page=2"), expect.anything()));
  });
});
