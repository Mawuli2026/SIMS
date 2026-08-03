import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ProductManagement from "./ProductManagement";
import { AUTH_TOKEN_KEY } from "../../../utils/authSession";
import { Product } from "../../../types/product.types";

const sugar: Product = {
  id: 1,
  name: "Sugar",
  category: "Groceries",
  costPrice: 8,
  sellingPrice: 10,
  quantityInStock: 3,
  reorderLevel: 5,
  status: "Active",
};

const response = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
}) as Response;

describe("ProductManagement", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(AUTH_TOKEN_KEY, "admin-token");
  });

  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
  });

  it("creates a product through the authenticated API instead of local storage", async () => {
    jest.spyOn(global, "fetch").mockImplementation(async (_input, options) => {
      if (options?.method === "POST") {
        return response({
          message: "Product created successfully.",
          product: { id: 10, name: "Soap", category: "Household", costPrice: 4, sellingPrice: 6, quantityInStock: 10, reorderLevel: 3, status: "Active" },
        }, 201);
      }
      return response({ products: [] });
    });

    const user = userEvent.setup();
    render(<MemoryRouter><ProductManagement /></MemoryRouter>);

    expect(await screen.findByText(/no matching products/i)).toBeInTheDocument();
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

    expect(await screen.findByText("Soap")).toBeInTheDocument();
    const postCall = (fetch as jest.Mock).mock.calls.find(([, options]) => options?.method === "POST");
    expect(postCall?.[0]).toEqual(expect.stringContaining("/api/products"));
    expect(postCall?.[1]).toEqual(expect.objectContaining({
      headers: expect.objectContaining({ Authorization: "Bearer admin-token" }),
      body: expect.stringContaining('"name":"Soap"'),
    }));
    expect(localStorage.getItem("sims-products")).toBeNull();
  });

  it("loads the dedicated low-stock endpoint", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(response({ products: [sugar] }));

    render(<MemoryRouter><ProductManagement lowStockOnly /></MemoryRouter>);

    expect(screen.getByText(/loading products/i)).toBeInTheDocument();
    expect(await screen.findByText("Sugar")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/products/low-stock"), expect.objectContaining({
      headers: expect.objectContaining({ Authorization: "Bearer admin-token" }),
    }));
  });

  it("deactivates a product through the status endpoint", async () => {
    jest.spyOn(global, "fetch").mockImplementation(async (_input, options) => {
      if (options?.method === "PATCH") {
        return response({ message: "Product deactivated successfully.", product: { ...sugar, status: "Inactive" } });
      }
      return response({ products: [sugar] });
    });

    const user = userEvent.setup();
    render(<MemoryRouter><ProductManagement /></MemoryRouter>);
    await screen.findByText("Sugar");
    await user.click(screen.getByRole("button", { name: "Deactivate" }));

    expect(await screen.findByText("Inactive")).toBeInTheDocument();
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/products/1/status"), expect.objectContaining({
      method: "PATCH",
      body: JSON.stringify({ status: "Inactive" }),
    })));
  });
});
