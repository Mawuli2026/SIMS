import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Sale } from "../../../types/sale.types";
import { AUTH_TOKEN_KEY } from "../../../utils/authSession";
import ReceiptPage from "./ReceiptPage";

const sale: Sale = {
  id: 123456,
  receiptNumber: "SIMS-123456",
  createdAt: "2026-07-19T10:30:00.000Z",
  cashierName: "Alicia Ng",
  cashierEmail: "admin@sims.com",
  items: [{ productId: 3, productName: "Rice", unitPrice: 55, quantity: 2, lineTotal: 110 }],
  totalAmount: 110,
};

const response = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
}) as Response;

describe("ReceiptPage", () => {
  beforeEach(() => {
    localStorage.setItem(AUTH_TOKEN_KEY, "receipt-token");
    jest.spyOn(global, "fetch").mockResolvedValue(response({ sale }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
  });

  it("loads and shows all database receipt details", async () => {
    render(<MemoryRouter><ReceiptPage saleId={sale.id} /></MemoryRouter>);
    expect(await screen.findByText("SIMS-123456")).toBeInTheDocument();
    expect(screen.getByText("Alicia Ng")).toBeInTheDocument();
    expect(screen.getByText("Rice")).toBeInTheDocument();
    expect(screen.getAllByText("$110.00")).toHaveLength(2);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/sales/123456"), expect.objectContaining({
      headers: expect.objectContaining({ Authorization: "Bearer receipt-token" }),
    }));
  });

  it("prints the loaded receipt", async () => {
    const user = userEvent.setup();
    const print = jest.spyOn(window, "print").mockImplementation(() => {});
    render(<MemoryRouter><ReceiptPage saleId={sale.id} /></MemoryRouter>);

    await screen.findByText("SIMS-123456");
    await user.click(screen.getByRole("button", { name: /print receipt/i }));
    expect(print).toHaveBeenCalledTimes(1);
  });

  it("handles a missing database receipt", async () => {
    (fetch as jest.Mock).mockResolvedValue(response({ message: "Sale not found." }, 404));
    render(<MemoryRouter><ReceiptPage saleId={999} /></MemoryRouter>);
    expect(await screen.findByRole("heading", { name: /sale not found/i })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Sale not found.");
  });
});
