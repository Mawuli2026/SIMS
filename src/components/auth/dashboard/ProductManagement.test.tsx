import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ProductManagement from "./ProductManagement";
import { PRODUCTS_STORAGE_KEY } from "../../../utils/productStorage";

describe("ProductManagement", () => {
  beforeEach(() => localStorage.removeItem(PRODUCTS_STORAGE_KEY));

  it("adds a product and persists it", async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ProductManagement /></MemoryRouter>);

    await user.click(screen.getByRole("button", { name: /add product/i }));
    await user.type(screen.getByLabelText(/product name/i), "Soap");
    await user.type(screen.getByLabelText(/category/i), "Household");
    await user.clear(screen.getByLabelText(/cost price/i));
    await user.type(screen.getByLabelText(/cost price/i), "4");
    await user.clear(screen.getByLabelText(/selling price/i));
    await user.type(screen.getByLabelText(/selling price/i), "6");
    await user.clear(screen.getByLabelText(/quantity in stock/i));
    await user.type(screen.getByLabelText(/quantity in stock/i), "10");
    await user.clear(screen.getByLabelText(/reorder level/i));
    await user.type(screen.getByLabelText(/reorder level/i), "3");
    await user.click(screen.getByRole("button", { name: /save product/i }));

    expect(screen.getByText("Soap")).toBeInTheDocument();
    expect(localStorage.getItem(PRODUCTS_STORAGE_KEY)).toContain("Soap");
  });

  it("shows only products at or below their reorder level", () => {
    render(<MemoryRouter><ProductManagement lowStockOnly /></MemoryRouter>);
    expect(screen.getByText("Sugar")).toBeInTheDocument();
    expect(screen.queryByText("Rice")).not.toBeInTheDocument();
  });
});
