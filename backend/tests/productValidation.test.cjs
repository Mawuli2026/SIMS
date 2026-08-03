const assert = require("node:assert/strict");
const { test } = require("node:test");
const { toProduct } = require("../dist/services/product.service.js");
const { productSchema, productStatusSchema } = require("../dist/utils/validation.js");

const validProduct = {
  name: "  Sugar  ",
  category: "  Groceries  ",
  costPrice: 8,
  sellingPrice: 10,
  quantityInStock: 3,
  reorderLevel: 5,
};

test("product validation trims names and accepts valid inventory values", () => {
  const result = productSchema.safeParse(validProduct);
  assert.equal(result.success, true);
  assert.equal(result.data.name, "Sugar");
  assert.equal(result.data.category, "Groceries");
});

test("product validation rejects invalid prices and fractional stock", () => {
  const invalidSellingPrice = productSchema.safeParse({ ...validProduct, sellingPrice: 0 });
  assert.equal(invalidSellingPrice.success, false);
  assert.equal(invalidSellingPrice.error.issues[0].message, "Selling price must be greater than zero.");

  const fractionalStock = productSchema.safeParse({ ...validProduct, quantityInStock: 2.5 });
  assert.equal(fractionalStock.success, false);
  assert.equal(fractionalStock.error.issues[0].message, "Quantity in stock must be a whole number.");
});

test("product status accepts only Active or Inactive", () => {
  assert.equal(productStatusSchema.safeParse({ status: "Inactive" }).success, true);
  assert.equal(productStatusSchema.safeParse({ status: "deleted" }).success, false);
});

test("database product rows map to the public API contract", () => {
  assert.deepEqual(toProduct({
    id: 7,
    name: "Milk",
    category: "Dairy",
    cost_price: "6.00",
    selling_price: "8.50",
    quantity_in_stock: 2,
    reorder_level: 4,
    status: "active",
  }), {
    id: 7,
    name: "Milk",
    category: "Dairy",
    costPrice: 6,
    sellingPrice: 8.5,
    quantityInStock: 2,
    reorderLevel: 4,
    status: "Active",
  });
});
