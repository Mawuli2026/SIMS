export type PurchaseOrderStatus =
  | "Draft"
  | "Pending"
  | "Received"
  | "Cancelled";

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  costPrice: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;

  supplierId: string;
  supplierName: string;

  orderDate: string;
  expectedDate: string;

  status: PurchaseOrderStatus;

  items: PurchaseOrderItem[];

  subtotal: number;

  tax: number;

  discount: number;

  grandTotal: number;

  notes: string;

  createdAt: string;

  updatedAt: string;
}

export interface PurchaseOrderFormData {
  supplierId: string;
  orderDate: string;
  expectedDate: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  tax: number;
  discount: number;
  notes: string;
}