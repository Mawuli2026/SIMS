const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createInvoiceNumber, createInvoiceWithClient, InvoiceServiceError } = require("../dist/services/invoice.service.js");
const { createInvoiceSchema } = require("../dist/utils/validation.js");

test("invoice validation requires a customer and unique positive product quantities", () => {
  const validInvoice = {
    customerName: "A customer",
    customerEmail: "",
    customerPhone: "",
    items: [{ productId: 3, quantity: 2 }],
  };
  assert.equal(createInvoiceSchema.safeParse(validInvoice).success, true);
  assert.equal(createInvoiceSchema.safeParse({ ...validInvoice, customerName: " " }).success, false);
  assert.equal(createInvoiceSchema.safeParse({ ...validInvoice, customerEmail: "not-an-email" }).success, false);
  assert.equal(createInvoiceSchema.safeParse({ ...validInvoice, items: [{ productId: 3, quantity: 1.5 }] }).success, false);
  assert.equal(createInvoiceSchema.safeParse({
    ...validInvoice,
    items: [{ productId: 3, quantity: 1 }, { productId: 3, quantity: 2 }],
  }).success, false);
});

test("pro forma invoice IDs use a distinct stable invoice number format", () => {
  assert.equal(createInvoiceNumber(27), "SIMS-PF-00000027");
});

const createFakeClient = ({ status = "active" } = {}) => {
  const calls = [];
  return {
    calls,
    async query(sql, params = []) {
      const normalized = String(sql).replace(/\s+/g, " ").trim();
      calls.push({ sql: normalized, params });
      if (["BEGIN", "COMMIT", "ROLLBACK"].includes(normalized)) return { rows: [], rowCount: null };
      if (normalized.includes("FROM users")) return { rows: [{ first_name: "Alicia", last_name: "Ng" }], rowCount: 1 };
      if (normalized.includes("FROM products") && normalized.includes("FOR SHARE")) return { rows: [{
        id: 3, name: "Rice", selling_price: "55.00", quantity_in_stock: 1, status,
      }], rowCount: 1 };
      if (normalized.startsWith("INSERT INTO invoices")) return {
        rows: [{ id: 27, created_at: new Date("2026-08-03T10:00:00.000Z") }],
        rowCount: 1,
      };
      if (normalized.startsWith("INSERT INTO invoice_items")) return { rows: [], rowCount: 1 };
      throw new Error(`Unexpected SQL: ${normalized}`);
    },
  };
};

test("pro forma invoice snapshots server prices without creating sales or restricting quoted stock", async () => {
  const client = createFakeClient();
  const invoice = await createInvoiceWithClient(client, 1, {
    customerName: "Jordan Lee",
    customerEmail: "jordan@example.com",
    customerPhone: "555-0100",
    items: [{ productId: 3, quantity: 2 }],
  });

  assert.equal(invoice.id, 27);
  assert.equal(invoice.invoiceNumber, "SIMS-PF-00000027");
  assert.equal(invoice.createdByName, "Alicia Ng");
  assert.equal(invoice.totalAmount, 110);
  assert.deepEqual(invoice.items, [{
    productId: 3, productName: "Rice", unitPrice: 55, quantity: 2, lineTotal: 110,
  }]);
  assert.equal(client.calls.at(-1).sql, "COMMIT");
  assert.equal(client.calls.some((call) => /INSERT INTO sales|UPDATE products/.test(call.sql)), false);
});

test("inactive products reject invoice creation and roll back", async () => {
  const client = createFakeClient({ status: "inactive" });
  await assert.rejects(
    createInvoiceWithClient(client, 1, {
      customerName: "Jordan Lee",
      customerEmail: "",
      customerPhone: "",
      items: [{ productId: 3, quantity: 2 }],
    }),
    (error) => error instanceof InvoiceServiceError && error.statusCode === 409,
  );
  assert.equal(client.calls.at(-1).sql, "ROLLBACK");
  assert.equal(client.calls.some((call) => call.sql.startsWith("INSERT INTO invoices")), false);
});
