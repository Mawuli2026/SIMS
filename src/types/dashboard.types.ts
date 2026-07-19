export type UserRole = "Admin" | "Cashier";

export interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: UserRole;
  dateJoined: string;
  initial: string;
}

export interface SidebarItem {
  label: string;
  path: string;
}

export interface NotificationItem {
  id: number;
  type: "low_stock" | "sale_completed" | "system";
  message: string;
  createdAt: string;
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

export interface DashboardSummary {
  todaySales?: number;
  salesCountToday?: number;
  totalProducts?: number;
  lowStockCount?: number;
  mySalesToday?: number;
  mySalesCountToday?: number;
}