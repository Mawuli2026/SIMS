export type ProductStatus = "Active" | "Inactive";

export interface Product {
  id: number;
  name: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  quantityInStock: number;
  reorderLevel: number;
  status: ProductStatus;
}

export interface ProductInput {
  name: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  quantityInStock: number;
  reorderLevel: number;
}

export interface ProductRow {
  id: number;
  name: string;
  category: string | null;
  cost_price: string;
  selling_price: string;
  quantity_in_stock: number;
  reorder_level: number;
  status: "active" | "inactive";
}
