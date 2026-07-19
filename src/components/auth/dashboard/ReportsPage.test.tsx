import { fireEvent, render, screen } from "@testing-library/react";
import ReportsPage from "./ReportsPage";
import { Sale } from "../../../types/sale.types";
import { SALES_STORAGE_KEY } from "../../../utils/saleStorage";

const sales: Sale[] = [
  { id: 1, receiptNumber: "SIMS-1", createdAt: "2026-07-19T10:00:00.000Z", cashierName: "Alicia Ng", cashierEmail: "admin@sims.com", items: [{ productId: 1, productName: "Sugar", unitPrice: 10, quantity: 2, lineTotal: 20 }], totalAmount: 20 },
  { id: 2, receiptNumber: "SIMS-2", createdAt: "2026-07-18T10:00:00.000Z", cashierName: "Marcus Cole", cashierEmail: "cashier@sims.com", items: [{ productId: 3, productName: "Rice", unitPrice: 55, quantity: 1, lineTotal: 55 }], totalAmount: 55 },
];

describe("ReportsPage", () => {
  beforeEach(() => localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(sales)));

  it("calculates summaries and product performance from saved sales", () => {
    render(<ReportsPage />);
    expect(screen.getByText("$75.00")).toBeInTheDocument();
    expect(screen.getByText("$37.50")).toBeInTheDocument();
    expect(screen.getByText("Sugar")).toBeInTheDocument();
    expect(screen.getByText("Rice")).toBeInTheDocument();
  });

  it("filters reports by an inclusive date range", () => {
    render(<ReportsPage />);
    fireEvent.change(screen.getByLabelText("From date"), { target: { value: "2026-07-19" } });
    fireEvent.change(screen.getByLabelText("To date"), { target: { value: "2026-07-19" } });
    expect(screen.getAllByText("$20.00").length).toBeGreaterThan(0);
    expect(screen.queryByText("Rice")).not.toBeInTheDocument();
  });

  it("shows empty states when no sales exist", () => {
    localStorage.setItem(SALES_STORAGE_KEY, "[]");
    render(<ReportsPage />);
    expect(screen.getByText(/no product sales are available/i)).toBeInTheDocument();
    expect(screen.getByText(/no cashier sales are available/i)).toBeInTheDocument();
  });
});
