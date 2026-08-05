const assert = require("node:assert/strict");
const { test } = require("node:test");
const { authorizeRoles, requirePasswordChangeCompleted } = require("../dist/middleware/auth.middleware.js");

const createResponse = () => ({
  statusCode: 200,
  body: undefined,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test("role authorization requires authentication to run first", () => {
  const request = {};
  const response = createResponse();
  let nextCalled = false;

  authorizeRoles("SystemAdmin")(request, response, () => {
    nextCalled = true;
  });

  assert.equal(response.statusCode, 401);
  assert.deepEqual(response.body, { message: "Authentication is required." });
  assert.equal(nextCalled, false);
});

test("role authorization rejects an authenticated user without an allowed role", () => {
  const request = { authUser: { id: 7, role: "Cashier" } };
  const response = createResponse();
  let nextCalled = false;

  authorizeRoles("SystemAdmin", "Manager")(request, response, () => {
    nextCalled = true;
  });

  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, { message: "You do not have permission to access this resource." });
  assert.equal(nextCalled, false);
});

test("role authorization allows an authenticated user with an allowed role", () => {
  const request = { authUser: { id: 3, role: "SystemAdmin" } };
  const response = createResponse();
  let nextCalled = false;

  authorizeRoles("SystemAdmin")(request, response, () => {
    nextCalled = true;
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body, undefined);
  assert.equal(nextCalled, true);
});

test("role authorization supports routes shared by multiple roles", () => {
  const request = { authUser: { id: 9, role: "Cashier" } };
  const response = createResponse();
  let nextCalled = false;

  authorizeRoles("SystemAdmin", "Manager", "Cashier")(request, response, () => {
    nextCalled = true;
  });

  assert.equal(response.statusCode, 200);
  assert.equal(nextCalled, true);
});

test("authorization policies enforce the complete protected-module role matrix", () => {
  const policies = {
    dashboard: ["SystemAdmin", "Manager", "Cashier"],
    sales: ["SystemAdmin", "Manager", "Cashier"],
    products: ["SystemAdmin", "Manager"],
    reports: ["SystemAdmin", "Manager"],
    employees: ["SystemAdmin"],
    auditLogs: ["SystemAdmin"],
  };

  for (const [moduleName, allowedRoles] of Object.entries(policies)) {
    for (const role of ["SystemAdmin", "Manager", "Cashier"]) {
      const request = { authUser: { id: 1, role } };
      const response = createResponse();
      let nextCalled = false;
      authorizeRoles(...allowedRoles)(request, response, () => { nextCalled = true; });
      assert.equal(nextCalled, allowedRoles.includes(role), `${role} access to ${moduleName}`);
      assert.equal(response.statusCode, allowedRoles.includes(role) ? 200 : 403, `${role} status for ${moduleName}`);
    }
  }
});

test("password-change enforcement blocks temporary-password sessions", () => {
  const request = { authUser: { id: 9, role: "Cashier", mustChangePassword: true } };
  const response = createResponse();
  let nextCalled = false;

  requirePasswordChangeCompleted(request, response, () => { nextCalled = true; });

  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, {
    code: "PASSWORD_CHANGE_REQUIRED",
    message: "You must change your temporary password before accessing SIMS.",
  });
  assert.equal(nextCalled, false);
});

test("password-change enforcement allows completed accounts", () => {
  const request = { authUser: { id: 9, role: "Cashier", mustChangePassword: false } };
  const response = createResponse();
  let nextCalled = false;

  requirePasswordChangeCompleted(request, response, () => { nextCalled = true; });

  assert.equal(response.statusCode, 200);
  assert.equal(nextCalled, true);
});
