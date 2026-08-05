import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import SalesCart from "./SalesCart";
import { AUTH_TOKEN_KEY } from "../../../utils/authSession";
import { UserProfile } from "../../../types/dashboard.types";
import { SaleProduct } from "../../../types/sale.types";

const userProfile: UserProfile = {
  id: 1, firstName: "Alicia", lastName: "Ng", fullName: "Alicia Ng", email: "admin@sims.com",
  role: "Manager", mustChangePassword: false, dateJoined: "2024-01-15", initial: "A",
};

const products: SaleProduct[] = [
  { id: 1, name: "Sugar", sellingPrice: 10, quantityInStock: 3 },
  { id: 3, name: "Rice", sellingPrice: 55, quantityInStock: 18 },
];

const savedSale = {
  id: 27,
  receiptNumber: "SIMS-27",
  createdAt: "2026-08-03T10:00:00.000Z",
  cashierName: "Alicia Ng",
  cashierEmail: "admin@sims.com",
  items: [{ productId: 3, productName: "Rice", unitPrice: 55, quantity: 2, lineTotal: 110, remainingStock: 16 }],
  totalAmount: 110,
};

const response = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
}) as Response;

const renderCart = () => render(<MemoryRouter><SalesCart user={userProfile} /></MemoryRouter>);

describe("SalesCart", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(AUTH_TOKEN_KEY, "sales-token");
  });

  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
  });

  const mockProductLoad = () => jest.spyOn(global, "fetch").mockResolvedValue(response({ products }));

  it("loads database products and calculates line and sale totals", async () => {
    mockProductLoad();
    const user = userEvent.setup();
    renderCart();

    expect(screen.getByRole("option", { name: /loading active products/i })).toBeInTheDocument();
    await screen.findByRole("option", { name: /Rice/ });
    await user.selectOptions(screen.getByLabelText("Product"), "3");
    await user.clear(screen.getByLabelText("Quantity"));
    await user.type(screen.getByLabelText("Quantity"), "2");
    await user.click(screen.getByRole("button", { name: /add to sale/i }));

    expect(screen.getAllByText("$110.00")).toHaveLength(2);
    expect(screen.getByText("Rice")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/sales/products"), expect.objectContaining({
      headers: expect.objectContaining({ Authorization: "Bearer sales-token" }),
    }));
  });

  it("prevents quantities above the most recently loaded stock", async () => {
    mockProductLoad();
    const user = userEvent.setup();
    renderCart();
    await screen.findByRole("option", { name: /Sugar/ });
    await user.selectOptions(screen.getByLabelText("Product"), "1");
    await user.clear(screen.getByLabelText("Quantity"));
    await user.type(screen.getByLabelText("Quantity"), "4");
    await user.click(screen.getByRole("button", { name: /add to sale/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/insufficient stock for sugar/i);
    expect(screen.queryByText("$40.00")).not.toBeInTheDocument();
  });

  it("submits product IDs and quantities and uses the server-created sale", async () => {
    jest.spyOn(global, "fetch").mockImplementation(async (_input, options) => {
      if (options?.method === "POST") return response({ message: "Sale completed successfully.", sale: savedSale }, 201);
      return response({ products });
    });

    const user = userEvent.setup();
    renderCart();
    await screen.findByRole("option", { name: /Rice/ });
    await user.selectOptions(screen.getByLabelText("Product"), "3");
    await user.clear(screen.getByLabelText("Quantity"));
    await user.type(screen.getByLabelText("Quantity"), "2");
    await user.click(screen.getByRole("button", { name: /add to sale/i }));
    await user.click(screen.getByRole("button", { name: /complete sale/i }));

    expect(await screen.findByRole("status")).toHaveTextContent(/sale completed successfully/i);
    expect(screen.getByRole("link", { name: /view receipt/i })).toHaveAttribute("href", "/dashboard/receipts/27");
    const postCall = (fetch as jest.Mock).mock.calls.find(([, options]) => options?.method === "POST");
    expect(postCall?.[0]).toEqual(expect.stringContaining("/api/sales"));
    expect(postCall?.[1]).toEqual(expect.objectContaining({
      headers: expect.objectContaining({ Authorization: "Bearer sales-token" }),
      body: JSON.stringify({ items: [{ productId: 3, quantity: 2 }] }),
    }));
    expect(localStorage.getItem("sims-sales")).toBeNull();
  });

  it("keeps the cart intact when the server rejects checkout for current stock", async () => {
    jest.spyOn(global, "fetch").mockImplementation(async (_input, options) => {
      if (options?.method === "POST") return response({ message: "Insufficient stock for Rice. Only 1 available." }, 409);
      return response({ products });
    });

    const user = userEvent.setup();
    renderCart();
    await screen.findByRole("option", { name: /Rice/ });
    await user.selectOptions(screen.getByLabelText("Product"), "3");
    await user.clear(screen.getByLabelText("Quantity"));
    await user.type(screen.getByLabelText("Quantity"), "2");
    await user.click(screen.getByRole("button", { name: /add to sale/i }));
    await user.click(screen.getByRole("button", { name: /complete sale/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/insufficient stock for rice/i);
    expect(screen.getByText("Rice")).toBeInTheDocument();
    expect(localStorage.getItem("sims-sales")).toBeNull();
    await waitFor(() => expect(screen.getByRole("button", { name: /complete sale/i })).toBeEnabled());
  });
});
