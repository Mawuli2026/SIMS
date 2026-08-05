import { query } from "../config/db";
import { ManagementRole, UserRole } from "../types/auth.types";
import {
  DashboardNotification,
  DashboardResponse,
  LowStockProduct,
  RecentSale,
  SidebarItem,
} from "../types/dashboard.types";

const MANAGEMENT_SIDEBAR: SidebarItem[] = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Products", path: "/dashboard/products" },
  { label: "Sales", path: "/dashboard/sales" },
  { label: "Sales History", path: "/dashboard/sales-history" },
  { label: "Reports", path: "/dashboard/reports" },
  { label: "Low Stock", path: "/dashboard/low-stock" },
];

const SYSTEM_ADMIN_SIDEBAR: SidebarItem[] = [
  MANAGEMENT_SIDEBAR[0],
  { label: "Employees", path: "/dashboard/employees" },
  { label: "Audit Logs", path: "/dashboard/audit-logs" },
  ...MANAGEMENT_SIDEBAR.slice(1),
];

const CASHIER_SIDEBAR: SidebarItem[] = [
  { label: "Record Sales", path: "/dashboard/sales" },
  { label: "Sales History", path: "/dashboard/sales-history" },
];

export const getSidebarForRole = (role: UserRole): SidebarItem[] =>
  role === "SystemAdmin" ? SYSTEM_ADMIN_SIDEBAR : role === "Manager" ? MANAGEMENT_SIDEBAR : CASHIER_SIDEBAR;

interface TodaySalesRow {
  today_sales: string;
}

interface SalesCountRow {
  sales_count_today: string;
}

interface TotalProductsRow {
  total_products: string;
}

interface LowStockCountRow {
  low_stock_count: string;
}

interface RecentSaleRow {
  id: number;
  total_amount: string;
  created_at: Date;
  first_name: string;
  last_name: string;
}

interface LowStockProductRow {
  id: number;
  name: string;
  quantity_in_stock: number;
  reorder_level: number;
}

const getTodaySalesTotal = async (): Promise<number> => {
  const result = await query<TodaySalesRow>(
    `SELECT COALESCE(SUM(total_amount), 0) AS today_sales
     FROM sales
     WHERE DATE(created_at) = CURRENT_DATE`,
  );
  return Number(result.rows[0].today_sales);
};

const getSalesCountToday = async (): Promise<number> => {
  const result = await query<SalesCountRow>(
    `SELECT COUNT(*) AS sales_count_today
     FROM sales
     WHERE DATE(created_at) = CURRENT_DATE`,
  );
  return Number(result.rows[0].sales_count_today);
};

const getMyTodaySalesTotal = async (cashierId: number): Promise<number> => {
  const result = await query<TodaySalesRow>(
    `SELECT COALESCE(SUM(total_amount), 0) AS today_sales
     FROM sales
     WHERE cashier_id = $1
       AND DATE(created_at) = CURRENT_DATE`,
    [cashierId],
  );
  return Number(result.rows[0].today_sales);
};

const getMySalesCountToday = async (cashierId: number): Promise<number> => {
  const result = await query<SalesCountRow>(
    `SELECT COUNT(*) AS sales_count_today
     FROM sales
     WHERE cashier_id = $1
       AND DATE(created_at) = CURRENT_DATE`,
    [cashierId],
  );
  return Number(result.rows[0].sales_count_today);
};

const getTotalProducts = async (): Promise<number> => {
  const result = await query<TotalProductsRow>(
    `SELECT COUNT(*) AS total_products
     FROM products
     WHERE status = 'active'`,
  );
  return Number(result.rows[0].total_products);
};

const getLowStockCount = async (): Promise<number> => {
  const result = await query<LowStockCountRow>(
    `SELECT COUNT(*) AS low_stock_count
     FROM products
     WHERE quantity_in_stock <= reorder_level
       AND status = 'active'`,
  );
  return Number(result.rows[0].low_stock_count);
};

const getRecentSales = async (limit = 5): Promise<RecentSale[]> => {
  const result = await query<RecentSaleRow>(
    `SELECT sales.id, sales.total_amount, sales.created_at, users.first_name, users.last_name
     FROM sales
     JOIN users ON sales.cashier_id = users.id
     ORDER BY sales.created_at DESC
     LIMIT $1`,
    [limit],
  );
  return result.rows.map((row) => ({
    saleId: row.id,
    cashierName: `${row.first_name} ${row.last_name}`,
    totalAmount: Number(row.total_amount),
    createdAt: row.created_at.toISOString(),
  }));
};

const getMyRecentSales = async (cashierId: number, limit = 5): Promise<RecentSale[]> => {
  const result = await query<Omit<RecentSaleRow, "first_name" | "last_name">>(
    `SELECT id, total_amount, created_at
     FROM sales
     WHERE cashier_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [cashierId, limit],
  );
  return result.rows.map((row) => ({
    saleId: row.id,
    totalAmount: Number(row.total_amount),
    createdAt: row.created_at.toISOString(),
  }));
};

const getLowStockProducts = async (limit = 10): Promise<LowStockProduct[]> => {
  const result = await query<LowStockProductRow>(
    `SELECT id, name, quantity_in_stock, reorder_level
     FROM products
     WHERE quantity_in_stock <= reorder_level
       AND status = 'active'
     ORDER BY quantity_in_stock ASC
     LIMIT $1`,
    [limit],
  );
  return result.rows.map((row) => ({
    productId: row.id,
    name: row.name,
    quantityInStock: row.quantity_in_stock,
    reorderLevel: row.reorder_level,
  }));
};

export const getManagerDashboard = async (role: ManagementRole): Promise<DashboardResponse> => {
  const [todaySales, salesCountToday, totalProducts, lowStockCount, recentSales, lowStockProducts] =
    await Promise.all([
      getTodaySalesTotal(),
      getSalesCountToday(),
      getTotalProducts(),
      getLowStockCount(),
      getRecentSales(),
      getLowStockProducts(),
    ]);

  return {
    role,
    summary: { todaySales, salesCountToday, totalProducts, lowStockCount },
    recentSales,
    lowStockProducts,
  };
};

export const getCashierDashboard = async (cashierId: number): Promise<DashboardResponse> => {
  const [mySalesToday, mySalesCountToday, recentSales] = await Promise.all([
    getMyTodaySalesTotal(cashierId),
    getMySalesCountToday(cashierId),
    getMyRecentSales(cashierId),
  ]);

  return {
    role: "Cashier",
    summary: { mySalesToday, mySalesCountToday },
    recentSales,
  };
};

const getManagementNotifications = async (): Promise<DashboardNotification[]> => {
  const [lowStockProducts, recentSales] = await Promise.all([getLowStockProducts(5), getRecentSales(5)]);

  const lowStockNotifications: DashboardNotification[] = lowStockProducts.map((product) => ({
    id: `low-stock-${product.productId}`,
    type: "low_stock",
    message: `${product.name} is low in stock.`,
    createdAt: new Date().toISOString(),
  }));

  const saleNotifications: DashboardNotification[] = recentSales.map((sale) => ({
    id: `sale-${sale.saleId}`,
    type: "sale_completed",
    message: `A sale of ${sale.totalAmount.toFixed(2)} was completed.`,
    createdAt: sale.createdAt,
  }));

  return [...lowStockNotifications, ...saleNotifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
};

const getCashierNotifications = async (cashierId: number): Promise<DashboardNotification[]> => {
  const recentSales = await getMyRecentSales(cashierId, 5);

  return recentSales
    .map((sale) => ({
      id: `sale-${sale.saleId}`,
      type: "sale_completed" as const,
      message: `Your sale of ${sale.totalAmount.toFixed(2)} was completed.`,
      createdAt: sale.createdAt,
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getNotificationsForRole = (role: UserRole, userId: number): Promise<DashboardNotification[]> =>
  role === "Cashier" ? getCashierNotifications(userId) : getManagementNotifications();
