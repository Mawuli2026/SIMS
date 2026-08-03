const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  calculateLineInCents,
  createReceiptNumber,
  createSaleWithClient,
  SaleServiceError,
} = require("../dist/services/sale.service.js");
const { createSaleSchema } = require("../dist/utils/validation.js");

test("sale validation requires unique products and positive whole quantities", () => {
  assert.equal(createSaleSchema.safeParse({ items: [] }).success, false);
  assert.equal(createSaleSchema.safeParse({ items: [{ productId: 1, quantity: 1.5 }] }).success, false);
  const duplicate = createSaleSchema.safeParse({ items: [
    { productId: 1, quantity: 1 },
    { productId: 1, quantity: 2 },
  ] });
  assert.equal(duplicate.success, false);
  assert.equal(duplicate.error.issues[0].message, "Each product may appear only once in a sale.");
});

test("sale totals use integer cents and receipt IDs use the shared format", () => {
  assert.equal(calculateLineInCents("8.50", 3), 2550);
  assert.equal(createReceiptNumber(123456789), "SIMS-23456789");
  assert.throws(() => calculateLineInCents("0.00", 1), SaleServiceError);
});

const createFakeClient = ({ stock = 18 } = {}) => {
  const calls = [];
  return {
    calls,
    async query(sql, params = []) {
      const normalized = String(sql).replace(/\s+/g, " ").trim();
      calls.push({ sql: normalized, params });
      if (normalized === "BEGIN" || normalized === "COMMIT" || normalized === "ROLLBACK") return { rows: [], rowCount: null };
      if (normalized.includes("FROM users")) return { rows: [{ first_name: "Alicia", last_name: "Ng", email: "admin@sims.com" }], rowCount: 1 };
      if (normalized.includes("FROM products") && normalized.includes("FOR UPDATE")) return { rows: [{
        id: 3, name: "Rice", selling_price: "55.00", quantity_in_stock: stock, status: "active",
      }], rowCount: 1 };
      if (normalized.startsWith("INSERT INTO sales")) return { rows: [{ id: 27, total_amount: "110.00", created_at: new Date("2026-08-03T10:00:00.000Z") }], rowCount: 1 };
      if (normalized.startsWith("INSERT INTO sale_items")) return { rows: [], rowCount: 1 };
      if (normalized.startsWith("UPDATE products")) return { rows: [], rowCount: 1 };
      throw new Error(`Unexpected SQL: ${normalized}`);
    },
  };
};

test("a successful transaction inserts the server-priced sale and reduces stock before commit", async () => {
  const client = createFakeClient();
  const sale = await createSaleWithClient(client, 1, { items: [{ productId: 3, quantity: 2 }] });

  assert.equal(sale.id, 27);
  assert.equal(sale.totalAmount, 110);
  assert.deepEqual(sale.items, [{ productId: 3, productName: "Rice", unitPrice: 55, quantity: 2, lineTotal: 110, remainingStock: 16 }]);
  assert.deepEqual(client.calls.map((call) => call.sql === "BEGIN" || call.sql === "COMMIT" ? call.sql : call.sql.split(" ").slice(0, 3).join(" ")), [
    "BEGIN", "SELECT first_name, last_name,", "SELECT id, name,", "INSERT INTO sales", "INSERT INTO sale_items", "UPDATE products SET", "COMMIT",
  ]);
  assert.deepEqual(client.calls[3].params, [1, "110.00"]);
  assert.deepEqual(client.calls[4].params, [27, 3, "Rice", 2, "55.00", "110.00"]);
  assert.deepEqual(client.calls[5].params, [2, 3]);
});

test("insufficient stock rolls back without inserting a sale or changing inventory", async () => {
  const client = createFakeClient({ stock: 1 });
  await assert.rejects(
    createSaleWithClient(client, 1, { items: [{ productId: 3, quantity: 2 }] }),
    (error) => error instanceof SaleServiceError && error.statusCode === 409 && /Insufficient stock/.test(error.message),
  );

  assert.equal(client.calls.at(-1).sql, "ROLLBACK");
  assert.equal(client.calls.some((call) => call.sql.startsWith("INSERT INTO sales")), false);
  assert.equal(client.calls.some((call) => call.sql.startsWith("UPDATE products")), false);
});
