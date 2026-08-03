export interface CartItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  availableStock: number;
}

export interface SaleItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  remainingStock?: number;
}

export interface Sale {
  id: number;
  receiptNumber: string;
  createdAt: string;
  cashierName: string;
  cashierEmail: string;
  items: SaleItem[];
  totalAmount: number;
}

export interface SaleProduct {
  id: number;
  name: string;
  sellingPrice: number;
  quantityInStock: number;
}

export interface SaleProductsResponse {
  products: SaleProduct[];
}

export interface CreateSaleRequest {
  items: Array<Pick<CartItem, "productId" | "quantity">>;
}

export interface CreateSaleResponse {
  message: string;
  sale: Sale;
}

export interface SalesResponse {
  sales: Sale[];
}

export interface SaleResponse {
  sale: Sale;
}

export const calculateLineTotal = (item: Pick<CartItem, "unitPrice" | "quantity">) => item.unitPrice * item.quantity;
export const calculateSaleTotal = (items: CartItem[]) => items.reduce((total, item) => total + calculateLineTotal(item), 0);
