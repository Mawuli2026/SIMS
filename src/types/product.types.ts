import { PaginationMeta } from "./pagination.types";

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

export type ProductFormValues = Omit<Product, "id" | "status">;

export interface ProductsResponse {
  products: Product[];
  pagination?: PaginationMeta;
}

export interface ProductMutationResponse {
  message: string;
  product: Product;
}
