export type StockMovementType =
  | "Stock In"
  | "Stock Out"
  | "Adjustment"
  | "Purchase"
  | "Sale"
  | "Return";

export interface StockMovement {
  id: string;

  productId: string;

  productName: string;

  type: StockMovementType;

  quantity: number;

  previousStock: number;

  newStock: number;

  reference?: string;

  notes?: string;

  createdAt: string;
}

export interface InventoryItem {
  id: string;

  productId: string;

  productName: string;

  sku: string;

  category: string;

  supplier: string;

  quantity: number;

  minimumStock: number;

  maximumStock: number;

  reorderLevel: number;

  costPrice: number;

  sellingPrice: number;

  inventoryValue: number;

  updatedAt: string;
}

export interface StockAdjustmentData {
  productId: string;

  quantity: number;

  reason: string;

  notes: string;
}