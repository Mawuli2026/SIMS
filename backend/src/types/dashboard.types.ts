import { UserRole } from "./auth.types";

export interface SidebarItem {
  label: string;
  path: string;
}

export interface SidebarResponse {
  role: UserRole;
  menuItems: SidebarItem[];
}

export interface DashboardSummary {
  todaySales?: number;
  salesCountToday?: number;
  totalProducts?: number;
  lowStockCount?: number;
  mySalesToday?: number;
  mySalesCountToday?: number;
}

export interface RecentSale {
  saleId: number;
  cashierName?: string;
  totalAmount: number;
  createdAt: string;
}

export interface LowStockProduct {
  productId: number;
  name: string;
  quantityInStock: number;
  reorderLevel: number;
}

export interface DashboardResponse {
  role: UserRole;
  summary: DashboardSummary;
  recentSales: RecentSale[];
  lowStockProducts?: LowStockProduct[];
}

export type NotificationType = "low_stock" | "sale_completed" | "system_message";

export interface DashboardNotification {
  type: NotificationType;
  message: string;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: DashboardNotification[];
}
