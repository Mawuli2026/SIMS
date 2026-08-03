const assert = require("node:assert/strict");
const { test } = require("node:test");
const { getSidebarForRole } = require("../dist/services/dashboard.service.js");

test("admin sidebar paths match the React dashboard routes", () => {
  assert.deepEqual(getSidebarForRole("Admin"), [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Products", path: "/dashboard/products" },
    { label: "Sales", path: "/dashboard/sales" },
    { label: "Sales History", path: "/dashboard/sales-history" },
    { label: "Reports", path: "/dashboard/reports" },
    { label: "Low Stock", path: "/dashboard/low-stock" },
  ]);
});

test("cashier sidebar contains only shared dashboard routes", () => {
  assert.deepEqual(getSidebarForRole("Cashier"), [
    { label: "Record Sales", path: "/dashboard/sales" },
    { label: "Sales History", path: "/dashboard/sales-history" },
  ]);
});
