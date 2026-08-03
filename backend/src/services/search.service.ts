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

const parseReceiptSaleId = (term: string): number | null => {
  const match = term.match(/^(?:SIMS-)?(\d{1,8})$/i);
  if (!match) return null;
  const saleId = Number(match[1]);
  return Number.isInteger(saleId) && saleId > 0 ? saleId : null;
};

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

const searchSales = async (term: string, cashierId: number | null): Promise<SaleSearchResult[]> => {
  const saleId = parseReceiptSaleId(term);

  const result = await query<SaleRow>(
    `SELECT sales.id, sales.total_amount, sales.created_at, users.first_name, users.last_name
     FROM sales
     JOIN users ON sales.cashier_id = users.id
     WHERE (($1::int IS NOT NULL AND sales.id = $1)
        OR (users.first_name || ' ' || users.last_name) ILIKE $2)
       AND ($3::int IS NULL OR sales.cashier_id = $3)
     ORDER BY sales.created_at DESC
     LIMIT 10`,
    [saleId, `%${term}%`, cashierId],
  );

  return result.rows.map((row) => ({
    saleId: row.id,
    cashierName: `${row.first_name} ${row.last_name}`,
    totalAmount: Number(row.total_amount),
    createdAt: row.created_at.toISOString(),
  }));
};

const searchReceipts = async (term: string, cashierId: number | null): Promise<ReceiptSearchResult[]> => {
  const saleId = parseReceiptSaleId(term);
  if (!saleId) return [];

  const result = await query<Pick<SaleRow, "id" | "total_amount" | "created_at">>(
    `SELECT id, total_amount, created_at
     FROM sales
     WHERE id = $1
       AND ($2::int IS NULL OR cashier_id = $2)
     LIMIT 1`,
    [saleId, cashierId],
  );

  return result.rows.map((row) => ({
    saleId: row.id,
    totalAmount: Number(row.total_amount),
    createdAt: row.created_at.toISOString(),
  }));
};

export const search = async (term: string, role: UserRole, userId: number): Promise<SearchResults> => {
  const cashierId = role === "Cashier" ? userId : null;
  const [products, sales, receipts] = await Promise.all([
    searchProducts(term),
    searchSales(term, cashierId),
    searchReceipts(term, cashierId),
  ]);

  return { products, sales, receipts };
};
