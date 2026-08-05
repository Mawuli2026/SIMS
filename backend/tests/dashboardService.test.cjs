const assert = require("node:assert/strict");
const { test } = require("node:test");
const { getSidebarForRole } = require("../dist/services/dashboard.service.js");

const managementSidebar = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Products", path: "/dashboard/products" },
    { label: "Sales", path: "/dashboard/sales" },
    { label: "Sales History", path: "/dashboard/sales-history" },
    { label: "Reports", path: "/dashboard/reports" },
    { label: "Low Stock", path: "/dashboard/low-stock" },
];

test("manager sidebar paths match the React dashboard routes", () => {
  assert.deepEqual(getSidebarForRole("Manager"), managementSidebar);
});

test("system admins receive protected employee and audit navigation plus manager routes", () => {
  assert.deepEqual(getSidebarForRole("SystemAdmin"), [
    managementSidebar[0],
    { label: "Employees", path: "/dashboard/employees" },
    { label: "Audit Logs", path: "/dashboard/audit-logs" },
    ...managementSidebar.slice(1),
  ]);
});

test("cashier sidebar contains only shared dashboard routes", () => {
  assert.deepEqual(getSidebarForRole("Cashier"), [
    { label: "Record Sales", path: "/dashboard/sales" },
    { label: "Sales History", path: "/dashboard/sales-history" },
  ]);
});
