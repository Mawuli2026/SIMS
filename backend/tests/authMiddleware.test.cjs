const assert = require("node:assert/strict");
const { test } = require("node:test");
const { authorizeRoles } = require("../dist/middleware/auth.middleware.js");

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

  authorizeRoles("Admin")(request, response, () => {
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

  authorizeRoles("Admin")(request, response, () => {
    nextCalled = true;
  });

  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, { message: "You do not have permission to access this resource." });
  assert.equal(nextCalled, false);
});

test("role authorization allows an authenticated user with an allowed role", () => {
  const request = { authUser: { id: 3, role: "Admin" } };
  const response = createResponse();
  let nextCalled = false;

  authorizeRoles("Admin")(request, response, () => {
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

  authorizeRoles("Admin", "Cashier")(request, response, () => {
    nextCalled = true;
  });

  assert.equal(response.statusCode, 200);
  assert.equal(nextCalled, true);
});
