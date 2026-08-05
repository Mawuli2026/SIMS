const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  createEmployeeSchema,
  employeeQuerySchema,
  employeePasswordSchema,
  employeeRoleSchema,
  employeeStatusSchema,
} = require("../dist/utils/validation.js");

const validEmployee = {
  firstName: "Marcus",
  lastName: "Cole",
  email: "marcus@example.com",
  role: "Cashier",
  password: "Temporary123!",
  confirmPassword: "Temporary123!",
};

test("employee creation accepts Manager/Cashier accounts with strong temporary passwords", () => {
  assert.equal(createEmployeeSchema.safeParse(validEmployee).success, true);
  assert.equal(createEmployeeSchema.safeParse({ ...validEmployee, role: "SystemAdmin" }).success, false);
  assert.equal(createEmployeeSchema.safeParse({ ...validEmployee, password: "short", confirmPassword: "short" }).success, false);
  assert.equal(createEmployeeSchema.safeParse({ ...validEmployee, confirmPassword: "Different123!" }).success, false);
});

test("employee filters and account mutations accept only known values", () => {
  assert.equal(employeeQuerySchema.safeParse({ q: "marcus", role: "Cashier", status: "Active" }).success, true);
  assert.equal(employeeQuerySchema.safeParse({ role: "Owner" }).success, false);
  assert.equal(employeeStatusSchema.safeParse({ status: "Disabled" }).success, true);
  assert.equal(employeeStatusSchema.safeParse({ status: "Deleted" }).success, false);
  assert.equal(employeeRoleSchema.safeParse({ role: "Manager" }).success, true);
  assert.equal(employeeRoleSchema.safeParse({ role: "SystemAdmin" }).success, false);
  assert.equal(employeePasswordSchema.safeParse({ password: "Temporary456!", confirmPassword: "Temporary456!" }).success, true);
  assert.equal(employeePasswordSchema.safeParse({ password: "short", confirmPassword: "short" }).success, false);
  assert.equal(employeePasswordSchema.safeParse({ password: "Temporary456!", confirmPassword: "Different456!" }).success, false);
});
