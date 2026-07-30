import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CashierDashboard from "./CashierDashboard";
import { UserProfile } from "../../../types/dashboard.types";
import { Sale } from "../../../types/sale.types";
import { SALES_STORAGE_KEY } from "../../../utils/saleStorage";

const cashier: UserProfile = { id: 2, firstName: "Marcus", lastName: "Cole", fullName: "Marcus Cole", email: "cashier@sims.com", role: "Cashier", dateJoined: "2026-01-01", initial: "M" };
const sales: Sale[] = [
  { id: 98765, receiptNumber: "SIMS-00098765", createdAt: new Date().toISOString(), cashierName: "Marcus Cole", cashierEmail: "cashier@sims.com", items: [{ productId: 1, productName: "Sugar", unitPrice: 10, quantity: 2, lineTotal: 20 }], totalAmount: 20 },
  { id: 12345, receiptNumber: "SIMS-00012345", createdAt: new Date().toISOString(), cashierName: "Alicia Ng", cashierEmail: "admin@sims.com", items: [], totalAmount: 50 },
];

describe("CashierDashboard", () => {
  it("links only the logged-in cashier's saved sales to real receipts", () => {
    localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(sales));
    render(<MemoryRouter><CashierDashboard user={cashier} /></MemoryRouter>);

    expect(screen.getByText("SIMS-00098765")).toBeInTheDocument();
    expect(screen.queryByText("SIMS-00012345")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view receipt/i })).toHaveAttribute("href", "/dashboard/receipts/98765");
  });
});
