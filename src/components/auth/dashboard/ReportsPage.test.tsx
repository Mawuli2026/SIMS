import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ReportResponse } from "../../../types/report.types";
import { AUTH_TOKEN_KEY } from "../../../utils/authSession";
import ReportsPage from "./ReportsPage";

const fullReport: ReportResponse = {
  summary: { totalRevenue: 75, transactions: 2, itemsSold: 3, averageSale: 37.5 },
  products: [
    { productId: 3, name: "Rice", unitsSold: 1, revenue: 55, transactions: 1 },
    { productId: 1, name: "Sugar", unitsSold: 2, revenue: 20, transactions: 1 },
  ],
  cashiers: [
    { email: "cashier@sims.com", name: "Marcus Cole", transactions: 1, itemsSold: 1, revenue: 55 },
    { email: "admin@sims.com", name: "Alicia Ng", transactions: 1, itemsSold: 2, revenue: 20 },
  ],
};

const filteredReport: ReportResponse = {
  summary: { totalRevenue: 20, transactions: 1, itemsSold: 2, averageSale: 20 },
  products: [{ productId: 1, name: "Sugar", unitsSold: 2, revenue: 20, transactions: 1 }],
  cashiers: [{ email: "admin@sims.com", name: "Alicia Ng", transactions: 1, itemsSold: 2, revenue: 20 }],
};

const emptyReport: ReportResponse = {
  summary: { totalRevenue: 0, transactions: 0, itemsSold: 0, averageSale: 0 },
  products: [],
  cashiers: [],
};

const response = (body: unknown) => ({ ok: true, status: 200, json: async () => body }) as Response;

describe("ReportsPage", () => {
  beforeEach(() => {
    localStorage.setItem(AUTH_TOKEN_KEY, "report-token");
    jest.spyOn(global, "fetch").mockResolvedValue(response(fullReport));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
  });

  it("shows summaries and performance returned by the reports API", async () => {
    render(<ReportsPage />);
    expect(await screen.findByText("$75.00")).toBeInTheDocument();
    expect(screen.getByText("$37.50")).toBeInTheDocument();
    expect(screen.getByText("Sugar")).toBeInTheDocument();
    expect(screen.getByText("Rice")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/reports"), expect.objectContaining({
      headers: expect.objectContaining({ Authorization: "Bearer report-token" }),
    }));
  });

  it("requests an inclusive date range from the API", async () => {
    (fetch as jest.Mock).mockImplementation(async (input: string) => response(
      input.includes("fromDate=2026-07-19") && input.includes("toDate=2026-07-19") ? filteredReport : fullReport,
    ));
    render(<ReportsPage />);
    await screen.findByText("$75.00");
    fireEvent.change(screen.getByLabelText("From date"), { target: { value: "2026-07-19" } });
    fireEvent.change(screen.getByLabelText("To date"), { target: { value: "2026-07-19" } });

    await waitFor(() => expect(screen.getAllByText("$20.00").length).toBeGreaterThan(0));
    expect(screen.queryByText("Rice")).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("fromDate=2026-07-19&toDate=2026-07-19"), expect.anything());
  });

  it("shows empty states when the API has no sales", async () => {
    (fetch as jest.Mock).mockResolvedValue(response(emptyReport));
    render(<ReportsPage />);
    expect(await screen.findByText(/no product sales are available/i)).toBeInTheDocument();
    expect(screen.getByText(/no cashier sales are available/i)).toBeInTheDocument();
  });
});
