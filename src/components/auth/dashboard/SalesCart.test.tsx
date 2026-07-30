import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import SalesCart from "./SalesCart";
import { PRODUCTS_STORAGE_KEY, starterProducts } from "../../../utils/productStorage";
import { SALES_STORAGE_KEY } from "../../../utils/saleStorage";
import { UserProfile } from "../../../types/dashboard.types";

const userProfile: UserProfile = {
  id: 1, firstName: "Alicia", lastName: "Ng", fullName: "Alicia Ng", email: "admin@sims.com",
  role: "Admin", dateJoined: "2024-01-15", initial: "A",
};

const renderCart = () => render(<MemoryRouter><SalesCart user={userProfile} /></MemoryRouter>);

describe("SalesCart", () => {
  beforeEach(() => {
    localStorage.removeItem(PRODUCTS_STORAGE_KEY);
    localStorage.removeItem(SALES_STORAGE_KEY);
  });

  it("calculates line and sale totals", async () => {
    const user = userEvent.setup();
    renderCart();
    await user.selectOptions(screen.getByLabelText("Product"), "3");
    await user.clear(screen.getByLabelText("Quantity"));
    await user.type(screen.getByLabelText("Quantity"), "2");
    await user.click(screen.getByRole("button", { name: /add to sale/i }));

    expect(screen.getAllByText("$110.00")).toHaveLength(2);
    expect(screen.getByText("Rice")).toBeInTheDocument();
  });

  it("prevents quantities above available stock", async () => {
    const user = userEvent.setup();
    renderCart();
    await user.selectOptions(screen.getByLabelText("Product"), "1");
    await user.clear(screen.getByLabelText("Quantity"));
    await user.type(screen.getByLabelText("Quantity"), "4");
    await user.click(screen.getByRole("button", { name: /add to sale/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/insufficient stock for sugar/i);
    expect(screen.queryByText("$40.00")).not.toBeInTheDocument();
  });

  it("completes a sale, stores it, and reduces stock", async () => {
    const user = userEvent.setup();
    renderCart();
    await user.selectOptions(screen.getByLabelText("Product"), "3");
    await user.clear(screen.getByLabelText("Quantity"));
    await user.type(screen.getByLabelText("Quantity"), "2");
    await user.click(screen.getByRole("button", { name: /add to sale/i }));
    await user.click(screen.getByRole("button", { name: /complete sale/i }));

    expect(screen.getByRole("status")).toHaveTextContent(/sale completed successfully/i);
    expect(localStorage.getItem(SALES_STORAGE_KEY)).toContain("Alicia Ng");
    expect(JSON.parse(localStorage.getItem(PRODUCTS_STORAGE_KEY) ?? "[]").find((product: { id: number }) => product.id === 3).quantityInStock).toBe(16);
  });

  it("does not store a sale or reduce stock when checkout validation fails", async () => {
    const user = userEvent.setup();
    renderCart();
    await user.selectOptions(screen.getByLabelText("Product"), "3");
    await user.clear(screen.getByLabelText("Quantity"));
    await user.type(screen.getByLabelText("Quantity"), "2");
    await user.click(screen.getByRole("button", { name: /add to sale/i }));

    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(starterProducts.map((product) =>
      product.id === 3 ? { ...product, quantityInStock: 1 } : product
    )));
    await user.click(screen.getByRole("button", { name: /complete sale/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/insufficient stock for rice/i);
    expect(localStorage.getItem(SALES_STORAGE_KEY)).toBeNull();
    expect(JSON.parse(localStorage.getItem(PRODUCTS_STORAGE_KEY) ?? "[]").find((product: { id: number }) => product.id === 3).quantityInStock).toBe(1);
  });
});
