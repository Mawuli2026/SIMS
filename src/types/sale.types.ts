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

export const calculateLineTotal = (item: Pick<CartItem, "unitPrice" | "quantity">) => item.unitPrice * item.quantity;
export const calculateSaleTotal = (items: CartItem[]) => items.reduce((total, item) => total + calculateLineTotal(item), 0);
