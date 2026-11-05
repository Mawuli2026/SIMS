import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import InvoicePage from "./InvoicePage";
import { AUTH_TOKEN_KEY } from "../../../utils/authSession";

const invoice = {
  id: 27,
  invoiceNumber: "SIMS-PF-00000027",
  createdAt: "2026-08-03T10:00:00.000Z",
  createdByName: "Alicia Ng",
  customerName: "Jordan Lee",
  customerEmail: "jordan@example.com",
  customerPhone: "555-0100",
  items: [{ productId: 3, productName: "Rice", unitPrice: 55, quantity: 2, lineTotal: 110 }],
  totalAmount: 110,
};

const response = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
}) as Response;

describe("InvoicePage", () => {
  beforeEach(() => {
    localStorage.setItem(AUTH_TOKEN_KEY, "invoice-token");
    jest.spyOn(global, "fetch").mockImplementation(async (input, options) => {
      const url = String(input);
      if (url.endsWith("/api/invoices") && options?.method === "POST") {
        return response({ message: "Created.", invoice });
      }
      if (url.endsWith("/api/invoices/27")) return response({ invoice });
      if (url.endsWith("/api/invoices")) return response({ invoices: [] });
      if (url.endsWith("/api/sales/products")) {
        return response({ products: [{ id: 3, name: "Rice", sellingPrice: 55, quantityInStock: 1 }] });
      }
      throw new Error(`Unexpected request: ${url}`);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
  });

  it("generates a pro forma invoice with customer details and opens the printable document", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/dashboard/invoices"]}>
        <Routes>
          <Route path="/dashboard/invoices" element={<InvoicePage />} />
          <Route path="/dashboard/invoices/:invoiceId" element={<InvoicePage invoiceId={27} />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(await screen.findByLabelText("Customer name"), "Jordan Lee");
    await user.type(screen.getByLabelText("Customer email"), "jordan@example.com");
    await user.selectOptions(screen.getByLabelText("Invoice product"), "3");
    await user.click(screen.getByRole("button", { name: "Add to Invoice" }));
    await user.click(screen.getByRole("button", { name: "Generate Pro Forma Invoice" }));

    expect(await screen.findByText("SIMS-PF-00000027")).toBeInTheDocument();
    expect(screen.getByText("Pro forma only — this document is not a completed sale.")).toBeInTheDocument();
    expect(screen.getByText("Stock is not reserved and inventory has not been changed.")).toBeInTheDocument();
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/invoices"), expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ Authorization: "******" }),
    })));
    const createCall = jest.mocked(fetch).mock.calls.find((call) =>
      String(call[0]).endsWith("/api/invoices") && (call[1] as RequestInit | undefined)?.method === "POST");
    expect(JSON.parse(String((createCall?.[1] as RequestInit).body))).toEqual({
      customerName: "Jordan Lee",
      customerEmail: "jordan@example.com",
      customerPhone: "",
      items: [{ productId: 3, quantity: 1 }],
    });
  });

  it("prints a previously generated invoice", async () => {
    const user = userEvent.setup();
    const print = jest.spyOn(window, "print").mockImplementation(() => {});
    render(<MemoryRouter><InvoicePage invoiceId={27} /></MemoryRouter>);
    await screen.findByText("SIMS-PF-00000027");
    await user.click(screen.getByRole("button", { name: "Print Invoice" }));
    expect(print).toHaveBeenCalledTimes(1);
  });
});
