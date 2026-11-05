import { PoolClient } from "pg";
import { pool, query } from "../config/db";
import { CreateInvoiceInput, InvoiceSummary, SavedInvoice, SavedInvoiceItem, createInvoiceNumber } from "../types/invoice.types";

export class InvoiceServiceError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = "InvoiceServiceError";
  }
}

interface ProductRow {
  id: number;
  name: string;
  selling_price: string;
  status: "active" | "inactive";
}

interface InvoiceHeaderRow {
  id: number;
  created_at: Date;
  created_by_name: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_amount: string;
}

interface InvoiceSummaryRow extends Omit<InvoiceHeaderRow, "customer_email" | "customer_phone"> {
  item_count: string;
}

interface InvoiceItemRow {
  invoice_id: number;
  product_id: number;
  product_name: string;
  unit_price: string;
  quantity: number;
  line_total: string;
}

const maximumMoneyInCents = 999_999_999_999;

const calculateLineInCents = (unitPrice: string, quantity: number) => {
  const unitPriceInCents = Math.round(Number(unitPrice) * 100);
  const lineTotalInCents = unitPriceInCents * quantity;
  if (!Number.isSafeInteger(unitPriceInCents) || unitPriceInCents <= 0 ||
      !Number.isSafeInteger(lineTotalInCents) || lineTotalInCents > maximumMoneyInCents) {
    throw new InvoiceServiceError("Invoice total exceeds the supported amount.", 400);
  }
  return lineTotalInCents;
};

const getInvoiceItems = async (invoiceIds: number[]): Promise<Map<number, SavedInvoiceItem[]>> => {
  if (invoiceIds.length === 0) return new Map();
  const result = await query<InvoiceItemRow>(
    `SELECT invoice_id, product_id, product_name, unit_price, quantity, line_total
     FROM invoice_items
     WHERE invoice_id = ANY($1::int[])
     ORDER BY invoice_id DESC, id ASC`,
    [invoiceIds],
  );
  const itemsByInvoice = new Map<number, SavedInvoiceItem[]>();
  result.rows.forEach((row) => {
    const items = itemsByInvoice.get(row.invoice_id) ?? [];
    items.push({
      productId: row.product_id,
      productName: row.product_name,
      unitPrice: Number(row.unit_price),
      quantity: row.quantity,
      lineTotal: Number(row.line_total),
    });
    itemsByInvoice.set(row.invoice_id, items);
  });
  return itemsByInvoice;
};

const toSavedInvoice = (row: InvoiceHeaderRow, items: SavedInvoiceItem[]): SavedInvoice => ({
  id: row.id,
  invoiceNumber: createInvoiceNumber(row.id),
  createdAt: row.created_at.toISOString(),
  createdByName: row.created_by_name,
  customerName: row.customer_name,
  customerEmail: row.customer_email,
  customerPhone: row.customer_phone,
  items,
  totalAmount: Number(row.total_amount),
});

export const getInvoices = async (): Promise<InvoiceSummary[]> => {
  const result = await query<InvoiceSummaryRow>(
    `SELECT invoices.id, invoices.created_at,
            CONCAT_WS(' ', users.first_name, users.last_name) AS created_by_name,
            invoices.customer_name, invoices.total_amount,
            COUNT(invoice_items.id)::text AS item_count
     FROM invoices
     JOIN users ON users.id = invoices.created_by
     LEFT JOIN invoice_items ON invoice_items.invoice_id = invoices.id
     GROUP BY invoices.id, users.first_name, users.last_name
     ORDER BY invoices.created_at DESC, invoices.id DESC
     LIMIT 50`,
  );
  return result.rows.map((row) => ({
    id: row.id,
    invoiceNumber: createInvoiceNumber(row.id),
    createdAt: row.created_at.toISOString(),
    createdByName: row.created_by_name,
    customerName: row.customer_name,
    totalAmount: Number(row.total_amount),
    itemCount: Number(row.item_count),
  }));
};

export const getInvoiceById = async (invoiceId: number): Promise<SavedInvoice> => {
  const result = await query<InvoiceHeaderRow>(
    `SELECT invoices.id, invoices.created_at,
            CONCAT_WS(' ', users.first_name, users.last_name) AS created_by_name,
            invoices.customer_name, invoices.customer_email, invoices.customer_phone, invoices.total_amount
     FROM invoices
     JOIN users ON users.id = invoices.created_by
     WHERE invoices.id = $1
     LIMIT 1`,
    [invoiceId],
  );
  const header = result.rows[0];
  if (!header) throw new InvoiceServiceError("Invoice not found.", 404);
  const itemsByInvoice = await getInvoiceItems([invoiceId]);
  return toSavedInvoice(header, itemsByInvoice.get(invoiceId) ?? []);
};

export const createInvoiceWithClient = async (
  client: PoolClient,
  createdBy: number,
  input: CreateInvoiceInput,
): Promise<SavedInvoice> => {
  try {
    await client.query("BEGIN");
    const creatorResult = await client.query<{ first_name: string; last_name: string }>(
      "SELECT first_name, last_name FROM users WHERE id = $1 LIMIT 1",
      [createdBy],
    );
    const creator = creatorResult.rows[0];
    if (!creator) throw new InvoiceServiceError("Manager account not found.", 404);

    const productIds = input.items.map((item) => item.productId);
    const productsResult = await client.query<ProductRow>(
      `SELECT id, name, selling_price, status
       FROM products
       WHERE id = ANY($1::int[])
       ORDER BY id ASC
       FOR SHARE`,
      [productIds],
    );
    const productsById = new Map(productsResult.rows.map((product) => [product.id, product]));
    const items: SavedInvoiceItem[] = [];
    let totalInCents = 0;

    for (const item of input.items) {
      const product = productsById.get(item.productId);
      if (!product) throw new InvoiceServiceError("One or more selected products no longer exist.", 409);
      if (product.status !== "active") {
        throw new InvoiceServiceError(`${product.name} is no longer available for invoicing.`, 409);
      }
      const lineTotalInCents = calculateLineInCents(product.selling_price, item.quantity);
      totalInCents += lineTotalInCents;
      if (!Number.isSafeInteger(totalInCents) || totalInCents > maximumMoneyInCents) {
        throw new InvoiceServiceError("Invoice total exceeds the supported amount.", 400);
      }
      items.push({
        productId: product.id,
        productName: product.name,
        unitPrice: Math.round(Number(product.selling_price) * 100) / 100,
        quantity: item.quantity,
        lineTotal: lineTotalInCents / 100,
      });
    }

    const totalAmount = (totalInCents / 100).toFixed(2);
    const headerResult = await client.query<{ id: number; created_at: Date }>(
      `INSERT INTO invoices (created_by, customer_name, customer_email, customer_phone, total_amount)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_at`,
      [createdBy, input.customerName, input.customerEmail, input.customerPhone, totalAmount],
    );
    const header = headerResult.rows[0];
    for (const item of items) {
      await client.query(
        `INSERT INTO invoice_items (invoice_id, product_id, product_name, quantity, unit_price, line_total)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [header.id, item.productId, item.productName, item.quantity, item.unitPrice.toFixed(2), item.lineTotal.toFixed(2)],
      );
    }
    await client.query("COMMIT");

    return {
      id: header.id,
      invoiceNumber: createInvoiceNumber(header.id),
      createdAt: header.created_at.toISOString(),
      createdByName: `${creator.first_name} ${creator.last_name}`,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      items,
      totalAmount: Number(totalAmount),
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
};

export const createInvoice = async (createdBy: number, input: CreateInvoiceInput): Promise<SavedInvoice> => {
  const client = await pool.connect();
  try {
    return await createInvoiceWithClient(client, createdBy, input);
  } finally {
    client.release();
  }
};
