// ======================================================
// Sales Service
// Smart Sales & Inventory Management System
// ======================================================

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discount: number;
  tax: number;
  total: number;
}

export interface Sale {
  id: string;
  saleNumber: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  cashierId: string;
  cashierName: string;
  paymentMethod: "Cash" | "Card" | "Mobile Money";
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  amountPaid: number;
  change: number;
  profit: number;
  status: "Completed" | "Refunded" | "Voided";
  createdAt: string;
  items: SaleItem[];
  // Refund/Void fields
  refundReason?: string;
  voidReason?: string;
  refundedAt?: string;
  voidedAt?: string;
  refundedBy?: string;
  voidedBy?: string;
}

const STORAGE_KEY = "sales";

// ======================================================
// Sales Service Class
// ======================================================

class SalesService {
  // ----------------------------------------
  // Load sales from Local Storage
  // ----------------------------------------
  private load(): Sale[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      console.error("Failed to load sales:", error);
      return [];
    }
  }

  // ----------------------------------------
  // Save sales
  // ----------------------------------------
  private save(sales: Sale[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));
  }

  // ----------------------------------------
  // Get all sales
  // ----------------------------------------
  getAll(): Sale[] {
    return this.load().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // ----------------------------------------
  // Get one sale
  // ----------------------------------------
  getById(id: string): Sale | undefined {
    return this.load().find((sale) => sale.id === id);
  }

  // ----------------------------------------
  // Create Sale
  // ----------------------------------------
  create(sale: Sale): Sale {
    const sales = this.load();
    sales.push(sale);
    this.save(sales);
    return sale;
  }

  // ----------------------------------------
  // Update Sale
  // ----------------------------------------
  update(id: string, updatedSale: Partial<Sale>): Sale | null {
    const sales = this.load();
    const index = sales.findIndex((sale) => sale.id === id);
    if (index === -1) {
      return null;
    }
    sales[index] = { ...sales[index], ...updatedSale };
    this.save(sales);
    return sales[index];
  }

  // ----------------------------------------
  // Delete Sale
  // ----------------------------------------
  remove(id: string): boolean {
    const sales = this.load();
    const filtered = sales.filter((sale) => sale.id !== id);
    if (filtered.length === sales.length) {
      return false;
    }
    this.save(filtered);
    return true;
  }

  // ----------------------------------------
  // Clear all sales
  // ----------------------------------------
  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  // ----------------------------------------
  // Search Sales
  // ----------------------------------------
  search(query: string): Sale[] {
    const keyword = query.toLowerCase().trim();
    return this.getAll().filter((sale) => {
      return (
        sale.saleNumber.toLowerCase().includes(keyword) ||
        sale.customerName.toLowerCase().includes(keyword) ||
        sale.cashierName.toLowerCase().includes(keyword)
      );
    });
  }

  // ----------------------------------------
  // Generate Invoice Number
  // ----------------------------------------
  generateInvoiceNumber(): string {
    const sales = this.getAll();
    const next = sales.length + 1;
    return `INV-${next.toString().padStart(5, "0")}`;
  }

  // ----------------------------------------
  // Calculate Subtotal
  // ----------------------------------------
  calculateSubtotal(items: SaleItem[]): number {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }

  // ----------------------------------------
  // Calculate Discount
  // ----------------------------------------
  calculateDiscount(items: SaleItem[]): number {
    return items.reduce((sum, item) => sum + (item.discount || 0), 0);
  }

  // ----------------------------------------
  // Calculate Tax
  // ----------------------------------------
  calculateTax(items: SaleItem[]): number {
    return items.reduce((sum, item) => sum + (item.tax || 0), 0);
  }

  // ----------------------------------------
  // Calculate Grand Total
  // ----------------------------------------
  calculateGrandTotal(items: SaleItem[]): number {
    const subtotal = this.calculateSubtotal(items);
    const discount = this.calculateDiscount(items);
    const tax = this.calculateTax(items);
    return subtotal - discount + tax;
  }

  // ----------------------------------------
  // Calculate Profit
  // ----------------------------------------
  calculateProfit(items: SaleItem[]): number {
    return items.reduce((profit, item) => {
      const itemProfit = (item.unitPrice - item.costPrice) * item.quantity;
      return profit + itemProfit;
    }, 0);
  }

  // ----------------------------------------
  // Get Sales by Customer
  // ----------------------------------------
  getByCustomer(customerName: string): Sale[] {
    return this.getAll().filter((sale) =>
      sale.customerName.toLowerCase().includes(customerName.toLowerCase())
    );
  }

  // ----------------------------------------
  // Get Sales by Cashier
  // ----------------------------------------
  getByCashier(cashierName: string): Sale[] {
    return this.getAll().filter((sale) =>
      sale.cashierName.toLowerCase().includes(cashierName.toLowerCase())
    );
  }

  // ----------------------------------------
  // Get Sales by Date
  // ----------------------------------------
  getByDate(date: string): Sale[] {
    return this.getAll().filter(
      (sale) => sale.createdAt.substring(0, 10) === date
    );
  }

  // ----------------------------------------
  // Get Today's Sales
  // ----------------------------------------
  getTodaySales(): Sale[] {
    const today = new Date().toISOString().split("T")[0];
    return this.getAll().filter(
      (sale) => sale.createdAt.substring(0, 10) === today
    );
  }

  // ----------------------------------------
  // Get Today's Revenue
  // ----------------------------------------
  getTodayRevenue(): number {
    return this.getTodaySales().reduce((total, sale) => total + sale.grandTotal, 0);
  }

  // ----------------------------------------
  // Get Today's Profit
  // ----------------------------------------
  getTodayProfit(): number {
    return this.getTodaySales().reduce((total, sale) => total + sale.profit, 0);
  }

  // ----------------------------------------
  // Get Number of Today's Sales
  // ----------------------------------------
  getTodaySalesCount(): number {
    return this.getTodaySales().length;
  }

  // ----------------------------------------
  // Get Recent Sales
  // ----------------------------------------
  getRecentSales(limit: number = 10): Sale[] {
    return this.getAll().slice(0, limit);
  }

  // ----------------------------------------
  // Get Total Revenue
  // ----------------------------------------
  getTotalRevenue(): number {
    return this.getAll().reduce((total, sale) => total + sale.grandTotal, 0);
  }

  // ----------------------------------------
  // Get Total Profit
  // ----------------------------------------
  getTotalProfit(): number {
    return this.getAll().reduce((total, sale) => total + sale.profit, 0);
  }

  // ----------------------------------------
  // Get Average Sale
  // ----------------------------------------
  getAverageSale(): number {
    const sales = this.getAll();
    if (sales.length === 0) {
      return 0;
    }
    return this.getTotalRevenue() / sales.length;
  }

  // ----------------------------------------
  // Dashboard Statistics
  // ----------------------------------------
  getDashboardStatistics() {
    const sales = this.getAll();
    return {
      totalSales: sales.length,
      todaySales: this.getTodaySalesCount(),
      todayRevenue: this.getTodayRevenue(),
      todayProfit: this.getTodayProfit(),
      totalRevenue: this.getTotalRevenue(),
      totalProfit: this.getTotalProfit(),
      averageSale: this.getAverageSale(),
      recentSales: this.getRecentSales(5),
    };
  }

  // ----------------------------------------
  // Monthly Revenue
  // ----------------------------------------
  getMonthlyRevenue(year: number, month: number): number {
    return this.getAll()
      .filter((sale) => {
        const date = new Date(sale.createdAt);
        return date.getFullYear() === year && date.getMonth() + 1 === month;
      })
      .reduce((total, sale) => total + sale.grandTotal, 0);
  }

  // ----------------------------------------
  // Monthly Profit
  // ----------------------------------------
  getMonthlyProfit(year: number, month: number): number {
    return this.getAll()
      .filter((sale) => {
        const date = new Date(sale.createdAt);
        return date.getFullYear() === year && date.getMonth() + 1 === month;
      })
      .reduce((total, sale) => total + sale.profit, 0);
  }

  // ----------------------------------------
  // Sales Between Dates
  // ----------------------------------------
  getSalesBetweenDates(startDate: string, endDate: string): Sale[] {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    return this.getAll().filter((sale) => {
      const saleDate = new Date(sale.createdAt).getTime();
      return saleDate >= start && saleDate <= end;
    });
  }

  // ----------------------------------------
  // Seed Demo Data (Development Only)
  // ----------------------------------------
  seedDemoData(): void {
    const existingSales = this.load();
    if (existingSales.length > 0) {
      return;
    }

    const demoSale: Sale = {
      id: crypto.randomUUID(),
      saleNumber: "INV-00001",
      customerId: "",
      customerName: "Walk-in Customer",
      customerPhone: "",
      customerEmail: "",
      customerAddress: "",
      cashierId: "1",
      cashierName: "Administrator",
      paymentMethod: "Cash",
      subtotal: 25,
      discount: 0,
      tax: 0,
      grandTotal: 25,
      amountPaid: 30,
      change: 5,
      profit: 10,
      status: "Completed",
      createdAt: new Date().toISOString(),
      items: [
        {
          id: crypto.randomUUID(),
          productId: "1",
          productName: "Sample Product",
          quantity: 1,
          unitPrice: 25,
          costPrice: 15,
          discount: 0,
          tax: 0,
          total: 25,
        },
      ],
    };

    this.save([demoSale]);
  }

  // ----------------------------------------
  // Get Next Invoice Number
  // ----------------------------------------
  getNextInvoiceNumber(): string {
    const sales = this.getAll();
    if (sales.length === 0) {
      return "INV-00001";
    }
    const highest = Math.max(
      ...sales.map((sale) => {
        const number = sale.saleNumber.replace("INV-", "");
        return parseInt(number, 10);
      })
    );
    return `INV-${String(highest + 1).padStart(5, "0")}`;
  }

  // ----------------------------------------
  // Check if Invoice Exists
  // ----------------------------------------
  invoiceExists(invoiceNumber: string): boolean {
    return this.getAll().some((sale) => sale.saleNumber === invoiceNumber);
  }

  // ----------------------------------------
  // Get Completed Sales
  // ----------------------------------------
  getCompletedSales(): Sale[] {
    return this.getAll().filter((sale) => sale.status === "Completed");
  }

  // ----------------------------------------
  // Get Refunded Sales
  // ----------------------------------------
  getRefundedSales(): Sale[] {
    return this.getAll().filter((sale) => sale.status === "Refunded");
  }

  // ----------------------------------------
  // Get Voided Sales
  // ----------------------------------------
  getVoidedSales(): Sale[] {
    return this.getAll().filter((sale) => sale.status === "Voided");
  }

  // ----------------------------------------
  // Void Sale (Updated with reason and user)
  // ----------------------------------------
  voidSale(
    id: string,
    reason: string,
    user = "Administrator"
  ): boolean {
    const sale = this.getById(id);
    if (!sale) {
      return false;
    }

    // Restore stock using inventoryService
    // Note: Make sure inventoryService is imported at the top
    // import inventoryService from './inventoryService';
    
    // This line assumes inventoryService is available
    // inventoryService.restoreStock(sale.items);

    sale.status = "Voided";
    sale.voidReason = reason;
    sale.voidedAt = new Date().toISOString();
    sale.voidedBy = user;

    this.update(id, sale);
    return true;
  }

  // ----------------------------------------
  // Refund Sale (Updated with reason and user)
  // ----------------------------------------
  refundSale(
    id: string,
    reason: string,
    user = "Administrator"
  ): boolean {
    const sale = this.getById(id);
    if (!sale) {
      return false;
    }

    // Restore stock using inventoryService
    // Note: Make sure inventoryService is imported at the top
    // import inventoryService from './inventoryService';
    
    // This line assumes inventoryService is available
    // inventoryService.restoreStock(sale.items);

    sale.status = "Refunded";
    sale.refundReason = reason;
    sale.refundedAt = new Date().toISOString();
    sale.refundedBy = user;

    this.update(id, sale);
    return true;
  }

  // ----------------------------------------
  // Initialize Service
  // ----------------------------------------
  initialize(): void {
    this.seedDemoData();
  }
}

const salesService = new SalesService();
salesService.initialize();

export default salesService;
export type { Sale, SaleItem };