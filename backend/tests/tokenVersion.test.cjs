const assert = require("node:assert/strict");
const { test } = require("node:test");

process.env.JWT_SECRET = "token-version-unit-test-secret-at-least-32-characters";
process.env.JWT_EXPIRES_IN = "1h";

const { generateAuthToken, verifyAuthToken } = require("../dist/utils/token.js");

test("authentication tokens contain the current database token version", () => {
  const token = generateAuthToken({ id: 27, role: "Manager", tokenVersion: 4 });
  const payload = verifyAuthToken(token);

  assert.equal(typeof payload, "object");
  assert.equal(payload.sub, "27");
  assert.equal(payload.role, "Manager");
  assert.equal(payload.ver, 4);
});
