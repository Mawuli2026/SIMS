export interface CreateSaleItemInput {
  productId: number;
  quantity: number;
}

export interface CreateSaleInput {
  items: CreateSaleItemInput[];
}

export interface SaleProduct {
  id: number;
  name: string;
  sellingPrice: number;
  quantityInStock: number;
}

export interface SavedSaleItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  remainingStock?: number;
}

export interface SavedSale {
  id: number;
  receiptNumber: string;
  createdAt: string;
  cashierName: string;
  cashierEmail: string;
  items: SavedSaleItem[];
  totalAmount: number;
}
