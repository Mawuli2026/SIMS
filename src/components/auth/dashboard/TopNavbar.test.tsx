import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import TopNavbar from "./TopNavbar";
import { UserProfile } from "../../../types/dashboard.types";
import { AUTH_TOKEN_KEY } from "../../../utils/authSession";

const manager: UserProfile = { id: 1, firstName: "Alicia", lastName: "Ng", fullName: "Alicia Ng", email: "manager@sims.com", role: "Manager", mustChangePassword: false, dateJoined: "2026-01-01", initial: "A" };

describe("TopNavbar", () => {
  beforeEach(() => {
    localStorage.setItem(AUTH_TOKEN_KEY, "admin-token");
    jest.spyOn(global, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("/api/dashboard/notifications")) return { ok: true, status: 200, json: async () => ({
        notifications: [{ id: "low-stock-1", type: "low_stock", message: "Sugar is low in stock.", createdAt: "2026-08-01T10:00:00.000Z" }],
      }) } as Response;
      if (url.includes("/api/search?q=Sugar")) return { ok: true, status: 200, json: async () => ({
        query: "Sugar", results: { products: [{ id: 1, name: "Sugar", sellingPrice: 10, quantityInStock: 3 }], sales: [], receipts: [] },
      }) } as Response;
      throw new Error(`Unexpected request: ${url}`);
    });
  });

  afterEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  it("loads notifications and returns searchable API results", async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><TopNavbar user={manager} onToggleSidebar={jest.fn()} /></MemoryRouter>);

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/dashboard/notifications"), expect.anything()));
    await user.click(screen.getByRole("button", { name: /notifications/i }));
    expect(await screen.findByText("Sugar is low in stock.")).toBeInTheDocument();

    const search = screen.getByRole("textbox", { name: /search products/i });
    await user.type(search, "Sugar{enter}");
    expect(await screen.findByText("1 match for “Sugar”")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Sugar/i })).toHaveAttribute("href", "/dashboard/products");
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/search?q=Sugar"), expect.objectContaining({
      headers: expect.objectContaining({ Authorization: "Bearer admin-token" }),
    }));
  });

  it("closes the profile menu when the user clicks elsewhere or presses Escape", async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><TopNavbar user={manager} onToggleSidebar={jest.fn()} /></MemoryRouter>);

    const profileButton = screen.getByRole("button", { name: /user profile/i });
    await user.click(profileButton);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(profileButton).toHaveAttribute("aria-expanded", "true");

    await user.click(screen.getByRole("textbox", { name: /search products/i }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(profileButton);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(profileButton).toHaveFocus();
  });
});
