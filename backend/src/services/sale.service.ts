import { PoolClient } from "pg";
import { pool, query } from "../config/db";
import { UserRole } from "../types/auth.types";
import {
  CreateSaleInput,
  SaleProduct,
  SalesListOptions,
  SalesListResult,
  SavedSale,
  SavedSaleItem,
} from "../types/sale.types";

export class SaleServiceError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = "SaleServiceError";
  }
}

interface SaleProductRow {
  id: number;
  name: string;
  selling_price: string;
  quantity_in_stock: number;
}

interface LockedProductRow extends SaleProductRow {
  status: "active" | "inactive";
}

interface CashierRow {
  first_name: string;
  last_name: string;
  email: string;
}

interface CreatedSaleRow {
  id: number;
  total_amount: string;
  created_at: Date;
}

interface SaleHeaderRow extends CreatedSaleRow {
  first_name: string;
  last_name: string;
  email: string;
}

interface HistoricalSaleItemRow {
  sale_id: number;
  product_id: number;
  product_name: string;
  unit_price: string;
  quantity: number;
  line_total: string;
}

interface SalesSummaryRow {
  transaction_count: string;
  total_value: string;
}

const maximumMoneyInCents = 999_999_999_999;

export const createReceiptNumber = (saleId: number) => `SIMS-${String(saleId).slice(-8)}`;

export const calculateLineInCents = (unitPrice: string | number, quantity: number): number => {
  const unitPriceInCents = Math.round(Number(unitPrice) * 100);
  if (!Number.isSafeInteger(unitPriceInCents) || unitPriceInCents <= 0) {
    throw new SaleServiceError("Product selling price must be greater than zero.", 409);
  }
  const lineTotalInCents = unitPriceInCents * quantity;
  if (!Number.isSafeInteger(lineTotalInCents) || lineTotalInCents > maximumMoneyInCents) {
    throw new SaleServiceError("Sale total exceeds the supported amount.", 400);
  }
  return lineTotalInCents;
};

export const getActiveSaleProducts = async (): Promise<SaleProduct[]> => {
  const result = await query<SaleProductRow>(
    `SELECT id, name, selling_price, quantity_in_stock
     FROM products
     WHERE status = 'active'
     ORDER BY name ASC, id ASC`,
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    sellingPrice: Number(row.selling_price),
    quantityInStock: row.quantity_in_stock,
  }));
};

const getItemsForSales = async (saleIds: number[]): Promise<Map<number, SavedSaleItem[]>> => {
  if (!saleIds.length) return new Map();

  const result = await query<HistoricalSaleItemRow>(
    `SELECT sale_id, product_id, product_name, unit_price, quantity, line_total
     FROM sale_items
     WHERE sale_id = ANY($1::int[])
     ORDER BY sale_id DESC, id ASC`,
    [saleIds],
  );

  const itemsBySale = new Map<number, SavedSaleItem[]>();
  result.rows.forEach((row) => {
    const items = itemsBySale.get(row.sale_id) ?? [];
    items.push({
      productId: row.product_id,
      productName: row.product_name,
      unitPrice: Number(row.unit_price),
      quantity: row.quantity,
      lineTotal: Number(row.line_total),
    });
    itemsBySale.set(row.sale_id, items);
  });
  return itemsBySale;
};

const toSavedSale = (row: SaleHeaderRow, items: SavedSaleItem[]): SavedSale => ({
  id: row.id,
  receiptNumber: createReceiptNumber(row.id),
  createdAt: row.created_at.toISOString(),
  cashierName: `${row.first_name} ${row.last_name}`,
  cashierEmail: row.email,
  items,
  totalAmount: Number(row.total_amount),
});

export const getSales = async (
  role: UserRole,
  userId: number,
  { page, pageSize, searchQuery, date }: SalesListOptions,
): Promise<SalesListResult> => {
  const cashierId = role === "Cashier" ? userId : null;
  const offset = (page - 1) * pageSize;
  const filters = `WHERE ($1::int IS NULL OR sales.cashier_id = $1)
    AND ($2::text IS NULL
      OR CONCAT_WS(' ', users.first_name, users.last_name, users.email) ILIKE '%' || $2 || '%'
      OR ('SIMS-' || LPAD(RIGHT(sales.id::text, 8), 8, '0')) ILIKE '%' || $2 || '%'
      OR EXISTS (
        SELECT 1 FROM sale_items matching_items
        WHERE matching_items.sale_id = sales.id
          AND matching_items.product_name ILIKE '%' || $2 || '%'
      ))
    AND ($3::date IS NULL
      OR (sales.created_at >= $3::date AND sales.created_at < $3::date + INTERVAL '1 day'))`;
  const filterParams = [cashierId, searchQuery || null, date || null];

  const [salesResult, summaryResult] = await Promise.all([
    query<SaleHeaderRow>(
      `SELECT sales.id, sales.total_amount, sales.created_at,
              users.first_name, users.last_name, users.email
       FROM sales
       JOIN users ON users.id = sales.cashier_id
       ${filters}
       ORDER BY sales.created_at DESC, sales.id DESC
       LIMIT $4 OFFSET $5`,
      [...filterParams, pageSize, offset],
    ),
    query<SalesSummaryRow>(
      `SELECT COUNT(*) AS transaction_count,
              COALESCE(SUM(sales.total_amount), 0) AS total_value
       FROM sales
       JOIN users ON users.id = sales.cashier_id
       ${filters}`,
      filterParams,
    ),
  ]);
  const itemsBySale = await getItemsForSales(salesResult.rows.map((sale) => sale.id));
  const summary = summaryResult.rows[0];

  return {
    sales: salesResult.rows.map((sale) => toSavedSale(sale, itemsBySale.get(sale.id) ?? [])),
    totalItems: Number(summary.transaction_count),
    summary: {
      transactionCount: Number(summary.transaction_count),
      totalValue: Number(summary.total_value),
    },
  };
};

export const getSaleById = async (saleId: number, role: UserRole, userId: number): Promise<SavedSale> => {
  const cashierFilter = role === "Cashier" ? "AND sales.cashier_id = $2" : "";
  const result = await query<SaleHeaderRow>(
    `SELECT sales.id, sales.total_amount, sales.created_at,
            users.first_name, users.last_name, users.email
     FROM sales
     JOIN users ON users.id = sales.cashier_id
     WHERE sales.id = $1
     ${cashierFilter}
     LIMIT 1`,
    role === "Cashier" ? [saleId, userId] : [saleId],
  );
  if (!result.rowCount) throw new SaleServiceError("Sale not found.", 404);

  const itemsBySale = await getItemsForSales([saleId]);
  return toSavedSale(result.rows[0], itemsBySale.get(saleId) ?? []);
};

const getCashier = async (client: PoolClient, cashierId: number): Promise<CashierRow> => {
  const result = await client.query<CashierRow>(
    `SELECT first_name, last_name, email
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [cashierId],
  );
  if (!result.rowCount) throw new SaleServiceError("Cashier account not found.", 404);
  return result.rows[0];
};

const lockProducts = async (client: PoolClient, productIds: number[]): Promise<Map<number, LockedProductRow>> => {
  const result = await client.query<LockedProductRow>(
    `SELECT id, name, selling_price, quantity_in_stock, status
     FROM products
     WHERE id = ANY($1::int[])
     ORDER BY id ASC
     FOR UPDATE`,
    [productIds],
  );
  return new Map(result.rows.map((product) => [product.id, product]));
};

export const createSaleWithClient = async (
  client: PoolClient,
  cashierId: number,
  input: CreateSaleInput,
): Promise<SavedSale> => {
  try {
    await client.query("BEGIN");
    const cashier = await getCashier(client, cashierId);
    const productsById = await lockProducts(client, input.items.map((item) => item.productId));
    const savedItems: SavedSaleItem[] = [];
    let totalInCents = 0;

    for (const item of input.items) {
      const product = productsById.get(item.productId);
      if (!product) throw new SaleServiceError("One or more selected products no longer exist.", 409);
      if (product.status !== "active") {
        throw new SaleServiceError(`${product.name} is no longer available for sale.`, 409);
      }
      if (item.quantity > product.quantity_in_stock) {
        throw new SaleServiceError(
          `Insufficient stock for ${product.name}. Only ${product.quantity_in_stock} available.`,
          409,
        );
      }

      const lineTotalInCents = calculateLineInCents(product.selling_price, item.quantity);
      totalInCents += lineTotalInCents;
      if (!Number.isSafeInteger(totalInCents) || totalInCents > maximumMoneyInCents) {
        throw new SaleServiceError("Sale total exceeds the supported amount.", 400);
      }

      savedItems.push({
        productId: product.id,
        productName: product.name,
        unitPrice: Number(product.selling_price),
        quantity: item.quantity,
        lineTotal: lineTotalInCents / 100,
        remainingStock: product.quantity_in_stock - item.quantity,
      });
    }

    const saleResult = await client.query<CreatedSaleRow>(
      `INSERT INTO sales (cashier_id, total_amount)
       VALUES ($1, $2)
       RETURNING id, total_amount, created_at`,
      [cashierId, (totalInCents / 100).toFixed(2)],
    );
    const sale = saleResult.rows[0];

    for (const item of savedItems) {
      await client.query(
        `INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, line_total)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [sale.id, item.productId, item.productName, item.quantity, item.unitPrice.toFixed(2), item.lineTotal.toFixed(2)],
      );
      const stockUpdate = await client.query(
        `UPDATE products
         SET quantity_in_stock = quantity_in_stock - $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
           AND quantity_in_stock >= $1`,
        [item.quantity, item.productId],
      );
      if (!stockUpdate.rowCount) {
        throw new SaleServiceError(`Insufficient stock for ${item.productName}.`, 409);
      }
    }

    await client.query("COMMIT");
    return {
      id: sale.id,
      receiptNumber: createReceiptNumber(sale.id),
      createdAt: sale.created_at.toISOString(),
      cashierName: `${cashier.first_name} ${cashier.last_name}`,
      cashierEmail: cashier.email,
      items: savedItems,
      totalAmount: Number(sale.total_amount),
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
};

export const createSale = async (cashierId: number, input: CreateSaleInput): Promise<SavedSale> => {
  const client = await pool.connect();
  try {
    return await createSaleWithClient(client, cashierId, input);
  } finally {
    client.release();
  }
};
