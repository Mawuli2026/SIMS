export interface ReportSummary {
  totalRevenue: number;
  transactions: number;
  itemsSold: number;
  averageSale: number;
}

export interface ProductPerformance {
  productId: number;
  name: string;
  unitsSold: number;
  revenue: number;
  transactions: number;
}

export interface CashierPerformance {
  email: string;
  name: string;
  transactions: number;
  itemsSold: number;
  revenue: number;
}

export interface ReportResponse {
  summary: ReportSummary;
  products: ProductPerformance[];
  cashiers: CashierPerformance[];
}
