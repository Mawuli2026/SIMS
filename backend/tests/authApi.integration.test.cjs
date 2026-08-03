const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { after, before, beforeEach, test } = require("node:test");
const dotenv = require("dotenv");
const { Client } = require("pg");

dotenv.config({ path: path.resolve(__dirname, "../.env"), quiet: true });

const sourceDatabaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
if (!sourceDatabaseUrl) {
  throw new Error("Set TEST_DATABASE_URL or DATABASE_URL before running PostgreSQL integration tests.");
}

const sourceUrl = new URL(sourceDatabaseUrl);
if (["prefer", "require", "verify-ca"].includes(sourceUrl.searchParams.get("sslmode"))) {
  sourceUrl.searchParams.set("sslmode", "verify-full");
}
const sourceDatabaseName = decodeURIComponent(sourceUrl.pathname.slice(1));
const usingExplicitTestDatabase = Boolean(process.env.TEST_DATABASE_URL);
const testDatabaseName = usingExplicitTestDatabase
  ? sourceDatabaseName
  : `${sourceDatabaseName}_test`;

if (!/test/i.test(testDatabaseName)) {
  throw new Error(`Refusing to run integration tests against database "${testDatabaseName}". Use a database name containing "test".`);
}

if (!/^[A-Za-z0-9_]+$/.test(testDatabaseName)) {
  throw new Error("The test database name may contain only letters, numbers, and underscores.");
}

const testDatabaseUrl = new URL(sourceUrl);
testDatabaseUrl.pathname = `/${testDatabaseName}`;

process.env.DATABASE_URL = testDatabaseUrl.toString();
process.env.JWT_SECRET = "sims-integration-test-secret-at-least-32-characters";
process.env.JWT_EXPIRES_IN = "1h";
process.env.CLIENT_URL = "http://localhost:5173";
process.env.NODE_ENV = "test";
process.env.PASSWORD_RESET_TTL_MINUTES = "30";

const app = require("../dist/app.js").default;
const { pool } = require("../dist/config/db.js");

let server;
let baseUrl;
let databaseReady = false;

const ssl = process.env.DATABASE_SSL === "true"
  ? { rejectUnauthorized: false }
  : undefined;
const configuredConnectionTimeout = Number(process.env.TEST_DATABASE_CONNECTION_TIMEOUT_MS);
const connectionTimeoutMillis = Number.isInteger(configuredConnectionTimeout) && configuredConnectionTimeout > 0
  ? configuredConnectionTimeout
  : 30_000;

const wait = (milliseconds) => new Promise((resolve) => {
  setTimeout(resolve, milliseconds);
});

const connectWithRetry = async (connectionString) => {
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const client = new Client({
      connectionString,
      ssl,
      connectionTimeoutMillis,
      keepAlive: true,
    });

    try {
      await client.connect();
      return client;
    } catch (error) {
      lastError = error;
      await client.end().catch(() => undefined);
      if (error && error.code === "3D000") throw error;
      if (attempt < 3) await wait(attempt * 1_000);
    }
  }

  throw lastError;
};

const ensureTestDatabaseExists = async () => {
  try {
    const testClient = await connectWithRetry(testDatabaseUrl.toString());
    await testClient.end();
    return;
  } catch (error) {
    if (!error || error.code !== "3D000") throw error;
  }

  const maintenanceUrl = new URL(sourceUrl);
  maintenanceUrl.pathname = "/postgres";
  const client = await connectWithRetry(maintenanceUrl.toString());

  try {
    const existing = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [testDatabaseName],
    );
    if (!existing.rowCount) {
      await client.query(`CREATE DATABASE "${testDatabaseName}"`);
    }
  } finally {
    await client.end();
  }
};

const startServer = () => new Promise((resolve, reject) => {
  server = app.listen(0, "127.0.0.1", () => {
    const address = server.address();
    if (!address || typeof address === "string") {
      reject(new Error("Unable to determine the integration test server address."));
      return;
    }
    baseUrl = `http://127.0.0.1:${address.port}`;
    resolve();
  });
  server.once("error", reject);
});

const stopServer = () => new Promise((resolve, reject) => {
  if (!server) {
    resolve();
    return;
  }
  server.close((error) => {
    if (error) reject(error);
    else resolve();
  });
});

const apiRequest = async (route, { method = "GET", body, token } = {}) => {
  const response = await fetch(`${baseUrl}${route}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  return {
    status: response.status,
    body: await response.json(),
  };
};

const validRegistration = {
  firstName: "Mawuli",
  lastName: "Ayikpa",
  email: "mawuli@example.com",
  role: "Admin",
  password: "Password123",
  confirmPassword: "Password123",
};

const registerUser = (overrides = {}) => apiRequest("/api/auth/register", {
  method: "POST",
  body: { ...validRegistration, ...overrides },
});

const loginUser = (overrides = {}) => apiRequest("/api/auth/login", {
  method: "POST",
  body: {
    email: validRegistration.email,
    password: validRegistration.password,
    ...overrides,
  },
});

before(async () => {
  await ensureTestDatabaseExists();
  const migrationsDirectory = path.resolve(__dirname, "../migrations");
  const migrations = fs.readdirSync(migrationsDirectory)
    .filter((fileName) => /^\d+_.+\.sql$/.test(fileName))
    .sort();
  for (const migrationFile of migrations) {
    const migration = fs.readFileSync(path.join(migrationsDirectory, migrationFile), "utf8");
    await pool.query(migration);
  }
  databaseReady = true;
  await startServer();
});

beforeEach(async () => {
  await pool.query("TRUNCATE TABLE sale_items, sales, products, users RESTART IDENTITY CASCADE");
});

after(async () => {
  try {
    if (databaseReady) {
      await pool.query("TRUNCATE TABLE sale_items, sales, products, users RESTART IDENTITY CASCADE");
    }
  } finally {
    await stopServer();
    await pool.end();
  }
});

test("register validates input, persists the user, and hashes the password", async () => {
  const missingFirstName = await registerUser({ firstName: "" });
  assert.equal(missingFirstName.status, 400);
  assert.equal(missingFirstName.body.message, "First name is required.");

  const invalidRole = await registerUser({ role: "Manager" });
  assert.equal(invalidRole.status, 400);
  assert.equal(invalidRole.body.message, "Role must be Admin or Cashier.");

  const mismatchedPassword = await registerUser({ confirmPassword: "DifferentPassword123" });
  assert.equal(mismatchedPassword.status, 400);
  assert.equal(mismatchedPassword.body.message, "Passwords do not match.");

  const created = await registerUser();
  assert.equal(created.status, 201);
  assert.deepEqual(created.body, {
    message: "Account created successfully. Please log in.",
  });

  const stored = await pool.query(
    "SELECT first_name, last_name, email, password_hash, role FROM users WHERE email = $1",
    [validRegistration.email],
  );
  assert.equal(stored.rowCount, 1);
  assert.equal(stored.rows[0].first_name, validRegistration.firstName);
  assert.equal(stored.rows[0].last_name, validRegistration.lastName);
  assert.equal(stored.rows[0].role, validRegistration.role);
  assert.notEqual(stored.rows[0].password_hash, validRegistration.password);
  assert.match(stored.rows[0].password_hash, /^\$2[aby]\$/);

  const duplicate = await registerUser();
  assert.equal(duplicate.status, 409);
  assert.equal(duplicate.body.message, "Email already exists.");
});

test("login returns a JWT and public profile while rejecting invalid credentials", async () => {
  await registerUser();

  const loggedIn = await loginUser();
  assert.equal(loggedIn.status, 200);
  assert.equal(loggedIn.body.message, "Login successful");
  assert.equal(typeof loggedIn.body.token, "string");
  assert.ok(loggedIn.body.token.length > 20);
  assert.equal(loggedIn.body.user.email, validRegistration.email);
  assert.equal(loggedIn.body.user.role, validRegistration.role);
  assert.equal("password" in loggedIn.body.user, false);
  assert.equal("passwordHash" in loggedIn.body.user, false);
  assert.equal("password_hash" in loggedIn.body.user, false);

  const wrongPassword = await loginUser({ password: "WrongPassword123" });
  assert.equal(wrongPassword.status, 401);
  assert.equal(wrongPassword.body.message, "Invalid email or password.");

  const unknownEmail = await loginUser({ email: "unknown@example.com" });
  assert.equal(unknownEmail.status, 401);
  assert.equal(unknownEmail.body.message, "Invalid email or password.");
});

test("me requires a valid JWT and returns the authenticated user", async () => {
  await registerUser();
  const loggedIn = await loginUser();

  const missingToken = await apiRequest("/api/auth/me");
  assert.equal(missingToken.status, 401);

  const invalidToken = await apiRequest("/api/auth/me", { token: "invalid-token" });
  assert.equal(invalidToken.status, 401);

  const currentUser = await apiRequest("/api/auth/me", { token: loggedIn.body.token });
  assert.equal(currentUser.status, 200);
  assert.equal(currentUser.body.user.email, validRegistration.email);
  assert.equal(currentUser.body.user.role, "Admin");
  assert.equal("passwordHash" in currentUser.body.user, false);
});

test("forgot-password stores an expiring token hash and keeps responses generic", async () => {
  await registerUser();

  const existingAccount = await apiRequest("/api/auth/forgot-password", {
    method: "POST",
    body: { email: validRegistration.email },
  });
  const unknownAccount = await apiRequest("/api/auth/forgot-password", {
    method: "POST",
    body: { email: "unknown@example.com" },
  });

  assert.equal(existingAccount.status, 200);
  assert.equal(unknownAccount.status, 200);
  assert.equal(existingAccount.body.message, unknownAccount.body.message);
  assert.equal(typeof existingAccount.body.resetUrl, "string");
  assert.equal("resetUrl" in unknownAccount.body, false);

  const rawToken = new URL(existingAccount.body.resetUrl).searchParams.get("resetToken");
  assert.ok(rawToken);

  const stored = await pool.query(
    `SELECT reset_token,
            reset_token_expires > NOW() AS "expiresInFuture"
     FROM users
     WHERE email = $1`,
    [validRegistration.email],
  );
  assert.equal(stored.rowCount, 1);
  assert.equal(
    stored.rows[0].reset_token,
    createHash("sha256").update(rawToken).digest("hex"),
  );
  assert.equal(stored.rows[0].expiresInFuture, true);
});

test("reset-password changes the password, clears the token, and prevents reuse", async () => {
  await registerUser();
  const forgotPassword = await apiRequest("/api/auth/forgot-password", {
    method: "POST",
    body: { email: validRegistration.email },
  });
  const resetToken = new URL(forgotPassword.body.resetUrl).searchParams.get("resetToken");

  const reset = await apiRequest("/api/auth/reset-password", {
    method: "POST",
    body: {
      resetToken,
      password: "NewPassword123",
      confirmPassword: "NewPassword123",
    },
  });
  assert.equal(reset.status, 200);

  const oldLogin = await loginUser();
  assert.equal(oldLogin.status, 401);
  const newLogin = await loginUser({ password: "NewPassword123" });
  assert.equal(newLogin.status, 200);

  const stored = await pool.query(
    "SELECT reset_token, reset_token_expires FROM users WHERE email = $1",
    [validRegistration.email],
  );
  assert.equal(stored.rows[0].reset_token, null);
  assert.equal(stored.rows[0].reset_token_expires, null);

  const reused = await apiRequest("/api/auth/reset-password", {
    method: "POST",
    body: {
      resetToken,
      password: "AnotherPassword123",
      confirmPassword: "AnotherPassword123",
    },
  });
  assert.equal(reused.status, 400);
  assert.equal(reused.body.message, "Password reset link is invalid or has expired.");
});

test("reset-password rejects an expired token", async () => {
  await registerUser();
  const forgotPassword = await apiRequest("/api/auth/forgot-password", {
    method: "POST",
    body: { email: validRegistration.email },
  });
  const resetToken = new URL(forgotPassword.body.resetUrl).searchParams.get("resetToken");

  await pool.query(
    "UPDATE users SET reset_token_expires = NOW() - INTERVAL '1 minute' WHERE email = $1",
    [validRegistration.email],
  );

  const expired = await apiRequest("/api/auth/reset-password", {
    method: "POST",
    body: {
      resetToken,
      password: "NewPassword123",
      confirmPassword: "NewPassword123",
    },
  });
  assert.equal(expired.status, 400);
  assert.equal(expired.body.message, "Password reset link is invalid or has expired.");
});

test("sales, receipts, reports, and receipt search use persisted PostgreSQL transactions", async () => {
  await registerUser();
  const adminLogin = await loginUser();
  const token = adminLogin.body.token;

  const createdProduct = await apiRequest("/api/products", {
    method: "POST",
    token,
    body: {
      name: "Rice",
      category: "Food",
      costPrice: 40,
      sellingPrice: 55,
      quantityInStock: 18,
      reorderLevel: 5,
    },
  });
  assert.equal(createdProduct.status, 201);

  const checkout = await apiRequest("/api/sales", {
    method: "POST",
    token,
    body: { items: [{ productId: createdProduct.body.product.id, quantity: 2 }] },
  });
  assert.equal(checkout.status, 201);
  assert.equal(checkout.body.sale.totalAmount, 110);
  assert.equal(checkout.body.sale.items[0].remainingStock, 16);

  const saleId = checkout.body.sale.id;
  const history = await apiRequest("/api/sales", { token });
  assert.equal(history.status, 200);
  assert.equal(history.body.sales.length, 1);
  assert.equal(history.body.sales[0].receiptNumber, checkout.body.sale.receiptNumber);

  await apiRequest(`/api/products/${createdProduct.body.product.id}`, {
    method: "PATCH",
    token,
    body: {
      name: "Premium Rice",
      category: "Food",
      costPrice: 40,
      sellingPrice: 60,
      quantityInStock: 16,
      reorderLevel: 5,
    },
  });

  const receipt = await apiRequest(`/api/sales/${saleId}`, { token });
  assert.equal(receipt.status, 200);
  assert.equal(receipt.body.sale.items[0].productName, "Rice");
  assert.equal(receipt.body.sale.items[0].unitPrice, 55);

  const report = await apiRequest("/api/reports", { token });
  assert.equal(report.status, 200);
  assert.deepEqual(report.body.summary, {
    totalRevenue: 110,
    transactions: 1,
    itemsSold: 2,
    averageSale: 110,
  });
  assert.equal(report.body.products[0].name, "Rice");
  assert.equal(report.body.cashiers[0].email, validRegistration.email);

  const datedReport = await apiRequest("/api/reports?fromDate=2999-01-01&toDate=2999-01-02", { token });
  assert.equal(datedReport.status, 200);
  assert.equal(datedReport.body.summary.transactions, 0);

  const receiptSearch = await apiRequest(`/api/search?q=${encodeURIComponent(checkout.body.sale.receiptNumber)}`, { token });
  assert.equal(receiptSearch.status, 200);
  assert.equal(receiptSearch.body.results.receipts[0].saleId, saleId);
});

test("cashiers only retrieve their own sales and cannot access reports", async () => {
  await registerUser();
  const adminLogin = await loginUser();
  const createdProduct = await apiRequest("/api/products", {
    method: "POST",
    token: adminLogin.body.token,
    body: {
      name: "Sugar",
      category: "Food",
      costPrice: 7,
      sellingPrice: 10,
      quantityInStock: 10,
      reorderLevel: 2,
    },
  });

  await registerUser({
    firstName: "Marcus",
    lastName: "Cole",
    email: "marcus@example.com",
    role: "Cashier",
  });
  const firstCashier = await loginUser({ email: "marcus@example.com" });
  const checkout = await apiRequest("/api/sales", {
    method: "POST",
    token: firstCashier.body.token,
    body: { items: [{ productId: createdProduct.body.product.id, quantity: 1 }] },
  });
  assert.equal(checkout.status, 201);

  await registerUser({
    firstName: "Esi",
    lastName: "Mensah",
    email: "esi@example.com",
    role: "Cashier",
  });
  const secondCashier = await loginUser({ email: "esi@example.com" });

  const ownHistory = await apiRequest("/api/sales", { token: firstCashier.body.token });
  assert.equal(ownHistory.body.sales.length, 1);
  const otherHistory = await apiRequest("/api/sales", { token: secondCashier.body.token });
  assert.equal(otherHistory.status, 200);
  assert.equal(otherHistory.body.sales.length, 0);

  const hiddenReceipt = await apiRequest(`/api/sales/${checkout.body.sale.id}`, { token: secondCashier.body.token });
  assert.equal(hiddenReceipt.status, 404);
  const forbiddenReport = await apiRequest("/api/reports", { token: firstCashier.body.token });
  assert.equal(forbiddenReport.status, 403);
});
