import { Product } from "../types/product.types";

export const PRODUCTS_STORAGE_KEY = "sims-products";

export const starterProducts: Product[] = [
  { id: 1, name: "Sugar", category: "Groceries", costPrice: 8, sellingPrice: 10, quantityInStock: 3, reorderLevel: 5, status: "Active" },
  { id: 2, name: "Milk", category: "Dairy", costPrice: 6, sellingPrice: 8.5, quantityInStock: 2, reorderLevel: 4, status: "Active" },
  { id: 3, name: "Rice", category: "Groceries", costPrice: 45, sellingPrice: 55, quantityInStock: 18, reorderLevel: 8, status: "Active" },
  { id: 4, name: "Orange Juice", category: "Beverages", costPrice: 12, sellingPrice: 15, quantityInStock: 12, reorderLevel: 5, status: "Active" },
];

export const loadProducts = (): Product[] => {
  try {
    const stored = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (!stored) return starterProducts;
    const products = JSON.parse(stored) as Product[];
    return Array.isArray(products) ? products : starterProducts;
  } catch {
    return starterProducts;
  }
};

export const saveProducts = (products: Product[]) => {
  localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
};
