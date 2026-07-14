export interface SaleItem {
  id: string;

  productId: string;

  productName: string;

  quantity: number;

  price: number;

  total: number;
}

export interface Sale {
  id: string;

  saleNumber: string;

  customerId: string;

  customerName: string;

  cashierId: string;

  cashierName: string;

  items: SaleItem[];

  subtotal: number;

  tax: number;

  discount: number;

  grandTotal: number;

  paymentMethod:
    | "Cash"
    | "Card"
    | "Mobile Money"
    | "Bank Transfer";

  paymentStatus:
    | "Paid"
    | "Pending";

  status:
    | "Completed"
    | "Cancelled"
    | "Refunded";

  notes?: string;

  createdAt: string;
}

export interface SaleFormData {
  customerId: string;

  customerName: string;

  cashierId: string;

  cashierName: string;

  items: SaleItem[];

  tax: number;

  discount: number;

  paymentMethod:
    | "Cash"
    | "Card"
    | "Mobile Money"
    | "Bank Transfer";

  paymentStatus:
    | "Paid"
    | "Pending";

  notes?: string;
}