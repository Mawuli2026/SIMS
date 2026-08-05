export type UserRole = "SystemAdmin" | "Manager" | "Cashier";

export interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: UserRole;
  mustChangePassword: boolean;
  dateJoined: string;
  initial: string;
}

export interface SidebarItem {
  label: string;
  path: string;
}

export interface NotificationItem {
  id: string;
  type: "low_stock" | "sale_completed" | "system_message";
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

export interface DashboardResponse {
  role: UserRole;
  summary: DashboardSummary;
  recentSales: RecentSale[];
  lowStockProducts?: LowStockProduct[];
}

export interface SidebarResponse {
  role: UserRole;
  menuItems: SidebarItem[];
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
}

export interface ProfileResponse {
  user: UserProfile;
}

export interface ProductSearchResult {
  id: number;
  name: string;
  sellingPrice: number;
  quantityInStock: number;
}

export interface SaleSearchResult {
  saleId: number;
  cashierName: string;
  totalAmount: number;
  createdAt: string;
}

export interface ReceiptSearchResult {
  saleId: number;
  totalAmount: number;
  createdAt: string;
}

export interface SearchResponse {
  query: string;
  results: {
    products: ProductSearchResult[];
    sales: SaleSearchResult[];
    receipts: ReceiptSearchResult[];
  };
}
