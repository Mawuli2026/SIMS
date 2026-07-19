import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ReceiptPage from "./ReceiptPage";
import { PRODUCTS_STORAGE_KEY } from "../../../utils/productStorage";
import { SALES_STORAGE_KEY } from "../../../utils/saleStorage";
import { Sale } from "../../../types/sale.types";

const sale: Sale = {
  id: 123456,
  receiptNumber: "SIMS-123456",
  createdAt: "2026-07-19T10:30:00.000Z",
  cashierName: "Alicia Ng",
  cashierEmail: "admin@sims.com",
  items: [{ productId: 3, productName: "Rice", unitPrice: 55, quantity: 2, lineTotal: 110 }],
  totalAmount: 110,
};

describe("ReceiptPage", () => {
  beforeEach(() => {
    localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify([sale]));
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify([{ id: 3, quantityInStock: 16 }]));
  });

  it("shows all saved receipt details", () => {
    render(<MemoryRouter><ReceiptPage saleId={sale.id} /></MemoryRouter>);
    expect(screen.getByText("SIMS-123456")).toBeInTheDocument();
    expect(screen.getByText("Alicia Ng")).toBeInTheDocument();
    expect(screen.getByText("Rice")).toBeInTheDocument();
    expect(screen.getAllByText("$110.00")).toHaveLength(2);
  });

  it("prints without changing sales or inventory", async () => {
    const user = userEvent.setup();
    const print = jest.spyOn(window, "print").mockImplementation(() => {});
    const salesBefore = localStorage.getItem(SALES_STORAGE_KEY);
    const productsBefore = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    render(<MemoryRouter><ReceiptPage saleId={sale.id} /></MemoryRouter>);

    await user.click(screen.getByRole("button", { name: /print receipt/i }));
    expect(print).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(SALES_STORAGE_KEY)).toBe(salesBefore);
    expect(localStorage.getItem(PRODUCTS_STORAGE_KEY)).toBe(productsBefore);
    print.mockRestore();
  });

  it("handles a missing receipt", () => {
    render(<MemoryRouter><ReceiptPage saleId={999} /></MemoryRouter>);
    expect(screen.getByText(/sale not found/i)).toBeInTheDocument();
  });
});
