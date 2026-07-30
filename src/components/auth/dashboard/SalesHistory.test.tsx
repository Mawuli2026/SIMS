import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import SalesHistory from "./SalesHistory";
import { UserProfile } from "../../../types/dashboard.types";
import { Sale } from "../../../types/sale.types";
import { SALES_STORAGE_KEY } from "../../../utils/saleStorage";

const sales: Sale[] = [
  { id: 1, receiptNumber: "SIMS-00000001", createdAt: "2026-07-19T10:00:00.000Z", cashierName: "Alicia Ng", cashierEmail: "admin@sims.com", items: [{ productId: 1, productName: "Sugar", unitPrice: 10, quantity: 2, lineTotal: 20 }], totalAmount: 20 },
  { id: 2, receiptNumber: "SIMS-00000002", createdAt: "2026-07-18T10:00:00.000Z", cashierName: "Marcus Cole", cashierEmail: "cashier@sims.com", items: [{ productId: 3, productName: "Rice", unitPrice: 55, quantity: 1, lineTotal: 55 }], totalAmount: 55 },
];

const makeUser = (role: "Admin" | "Cashier"): UserProfile => ({ id: 1, firstName: role === "Admin" ? "Alicia" : "Marcus", lastName: role === "Admin" ? "Ng" : "Cole", fullName: role === "Admin" ? "Alicia Ng" : "Marcus Cole", email: role === "Admin" ? "admin@sims.com" : "cashier@sims.com", role, dateJoined: "2026-01-01", initial: role[0] });

describe("SalesHistory", () => {
  beforeEach(() => localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(sales)));

  it("shows all sales to an admin and expands details", async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><SalesHistory user={makeUser("Admin")} /></MemoryRouter>);
    expect(screen.getByText("SIMS-00000001")).toBeInTheDocument();
    expect(screen.getByText("SIMS-00000002")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: /view details/i })[0]);
    expect(screen.getByText("Transaction details")).toBeInTheDocument();
    expect(screen.getByText("$10.00")).toBeInTheDocument();
  });

  it("limits a cashier to their own sales", () => {
    render(<MemoryRouter><SalesHistory user={makeUser("Cashier")} /></MemoryRouter>);
    expect(screen.getByText("SIMS-00000002")).toBeInTheDocument();
    expect(screen.queryByText("SIMS-00000001")).not.toBeInTheDocument();
  });

  it("searches by product and filters the visible results", async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><SalesHistory user={makeUser("Admin")} /></MemoryRouter>);
    await user.type(screen.getByLabelText(/search sales/i), "Rice");
    expect(screen.getByText("SIMS-00000002")).toBeInTheDocument();
    expect(screen.queryByText("SIMS-00000001")).not.toBeInTheDocument();
  });
});
