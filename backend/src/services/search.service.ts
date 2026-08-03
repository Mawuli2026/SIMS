import { query } from "../config/db";
import { UserRole } from "../types/auth.types";

export interface ProductSearchResult {
  id: number;
  name: string;
  sellingPrice: number;
  quantityInStock: number;
}

export interface SaleSearchResult {
  saleId: number;
  cashierName: string;
  totalAmount: number;
  createdAt: string;
}

export interface ReceiptSearchResult {
  saleId: number;
  totalAmount: number;
  createdAt: string;
}

export interface SearchResults {
  products: ProductSearchResult[];
  sales: SaleSearchResult[];
  receipts: ReceiptSearchResult[];
}

interface ProductRow {
  id: number;
  name: string;
  selling_price: string;
  quantity_in_stock: number;
}

interface SaleRow {
  id: number;
  total_amount: string;
  created_at: Date;
  first_name: string;
  last_name: string;
}

const searchProducts = async (term: string): Promise<ProductSearchResult[]> => {
  const result = await query<ProductRow>(
    `SELECT id, name, selling_price, quantity_in_stock
     FROM products
     WHERE status = 'active'
       AND (name ILIKE $1 OR category ILIKE $1)
     ORDER BY name ASC
     LIMIT 10`,
    [`%${term}%`],
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    sellingPrice: Number(row.selling_price),
    quantityInStock: row.quantity_in_stock,
  }));
};

const searchSales = async (term: string): Promise<SaleSearchResult[]> => {
  const saleId = Number(term);
  const isNumericTerm = Number.isInteger(saleId) && saleId > 0;

  const result = await query<SaleRow>(
    `SELECT sales.id, sales.total_amount, sales.created_at, users.first_name, users.last_name
     FROM sales
     JOIN users ON sales.cashier_id = users.id
     WHERE ($1::int IS NOT NULL AND sales.id = $1)
        OR (users.first_name || ' ' || users.last_name) ILIKE $2
     ORDER BY sales.created_at DESC
     LIMIT 10`,
    [isNumericTerm ? saleId : null, `%${term}%`],
  );

  return result.rows.map((row) => ({
    saleId: row.id,
    cashierName: `${row.first_name} ${row.last_name}`,
    totalAmount: Number(row.total_amount),
    createdAt: row.created_at.toISOString(),
  }));
};

const searchReceipts = async (term: string): Promise<ReceiptSearchResult[]> => {
  const saleId = Number(term);
  if (!Number.isInteger(saleId) || saleId <= 0) return [];

  const result = await query<Pick<SaleRow, "id" | "total_amount" | "created_at">>(
    `SELECT id, total_amount, created_at
     FROM sales
     WHERE id = $1
     LIMIT 1`,
    [saleId],
  );

  return result.rows.map((row) => ({
    saleId: row.id,
    totalAmount: Number(row.total_amount),
    createdAt: row.created_at.toISOString(),
  }));
};

/**
 * Both Admin and Cashier can search products, sales, and receipts.
 * The `role` parameter is accepted so future role-specific restrictions
 * (e.g. hiding cost price fields from Cashier product results) can be
 * layered in without changing the controller/route contract.
 */
export const search = async (term: string, _role: UserRole): Promise<SearchResults> => {
  const [products, sales, receipts] = await Promise.all([
    searchProducts(term),
    searchSales(term),
    searchReceipts(term),
  ]);

  return { products, sales, receipts };
};
