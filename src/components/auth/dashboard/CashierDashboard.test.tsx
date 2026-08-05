import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CashierDashboard from "./CashierDashboard";
import { UserProfile } from "../../../types/dashboard.types";
import { AUTH_TOKEN_KEY } from "../../../utils/authSession";

const cashier: UserProfile = { id: 2, firstName: "Marcus", lastName: "Cole", fullName: "Marcus Cole", email: "cashier@sims.com", role: "Cashier", mustChangePassword: false, dateJoined: "2026-01-01", initial: "M" };

describe("CashierDashboard", () => {
  beforeEach(() => {
    localStorage.setItem(AUTH_TOKEN_KEY, "cashier-token");
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        role: "Cashier",
        summary: { mySalesToday: 20, mySalesCountToday: 1 },
        recentSales: [{ saleId: 98765, totalAmount: 20, createdAt: "2026-08-01T10:00:00.000Z" }],
      }),
    } as Response);
  });

  afterEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  it("renders the authenticated cashier's database summary and receipt link", async () => {
    render(<MemoryRouter><CashierDashboard user={cashier} /></MemoryRouter>);

    expect(screen.getByText(/loading your sales summary/i)).toBeInTheDocument();
    expect(await screen.findByText("#98765")).toBeInTheDocument();
    expect(screen.getAllByText("$20.00")).toHaveLength(2);
    expect(screen.getByRole("link", { name: /view receipt/i })).toHaveAttribute("href", "/dashboard/receipts/98765");
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/dashboard"), expect.objectContaining({
      headers: expect.objectContaining({ Authorization: "Bearer cashier-token" }),
    }));
  });
});
