import { query } from "../config/db";
import {
  CashierPerformance,
  ProductPerformance,
  ReportDateRange,
  ReportResponse,
} from "../types/report.types";

interface SummaryRow {
  total_revenue: string;
  transactions: string;
  average_sale: string;
}

interface ItemsSoldRow {
  items_sold: string;
}

interface ProductPerformanceRow {
  product_id: number;
  name: string;
  units_sold: string;
  revenue: string;
  transactions: string;
}

interface CashierPerformanceRow {
  email: string;
  first_name: string;
  last_name: string;
  transactions: string;
  items_sold: string;
  revenue: string;
}

const dateFilter = `($1::date IS NULL OR sales.created_at >= $1::date)
  AND ($2::date IS NULL OR sales.created_at < $2::date + INTERVAL '1 day')`;

export const getReport = async ({ fromDate, toDate }: ReportDateRange): Promise<ReportResponse> => {
  const params = [fromDate ?? null, toDate ?? null];
  const [summaryResult, itemsResult, productsResult, cashiersResult] = await Promise.all([
    query<SummaryRow>(
      `SELECT COALESCE(SUM(sales.total_amount), 0) AS total_revenue,
              COUNT(*) AS transactions,
              COALESCE(AVG(sales.total_amount), 0) AS average_sale
       FROM sales
       WHERE ${dateFilter}`,
      params,
    ),
    query<ItemsSoldRow>(
      `SELECT COALESCE(SUM(sale_items.quantity), 0) AS items_sold
       FROM sale_items
       JOIN sales ON sales.id = sale_items.sale_id
       WHERE ${dateFilter}`,
      params,
    ),
    query<ProductPerformanceRow>(
      `SELECT sale_items.product_id, sale_items.product_name AS name,
              SUM(sale_items.quantity) AS units_sold,
              SUM(sale_items.line_total) AS revenue,
              COUNT(DISTINCT sale_items.sale_id) AS transactions
       FROM sale_items
       JOIN sales ON sales.id = sale_items.sale_id
       WHERE ${dateFilter}
       GROUP BY sale_items.product_id, sale_items.product_name
       ORDER BY revenue DESC, sale_items.product_name ASC`,
      params,
    ),
    query<CashierPerformanceRow>(
      `SELECT users.email, users.first_name, users.last_name,
              COUNT(DISTINCT sales.id) AS transactions,
              COALESCE(SUM(sale_items.quantity), 0) AS items_sold,
              COALESCE(SUM(sale_items.line_total), 0) AS revenue
       FROM sales
       JOIN users ON users.id = sales.cashier_id
       LEFT JOIN sale_items ON sale_items.sale_id = sales.id
       WHERE ${dateFilter}
       GROUP BY users.id, users.email, users.first_name, users.last_name
       ORDER BY revenue DESC, users.first_name ASC, users.last_name ASC`,
      params,
    ),
  ]);

  const summaryRow = summaryResult.rows[0];
  const products: ProductPerformance[] = productsResult.rows.map((row) => ({
    productId: row.product_id,
    name: row.name,
    unitsSold: Number(row.units_sold),
    revenue: Number(row.revenue),
    transactions: Number(row.transactions),
  }));
  const cashiers: CashierPerformance[] = cashiersResult.rows.map((row) => ({
    email: row.email,
    name: `${row.first_name} ${row.last_name}`,
    transactions: Number(row.transactions),
    itemsSold: Number(row.items_sold),
    revenue: Number(row.revenue),
  }));

  return {
    summary: {
      totalRevenue: Number(summaryRow.total_revenue),
      transactions: Number(summaryRow.transactions),
      itemsSold: Number(itemsResult.rows[0].items_sold),
      averageSale: Number(summaryRow.average_sale),
    },
    products,
    cashiers,
  };
};
