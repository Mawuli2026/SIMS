import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AppRoutes from "./AppRoutes";

describe("AppRoutes", () => {
  it("redirects the removed public registration path to login", async () => {
    render(<MemoryRouter initialEntries={["/register"]}><AppRoutes /></MemoryRouter>);

    expect(await screen.findByRole("button", { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /create account/i })).not.toBeInTheDocument();
  });
});
