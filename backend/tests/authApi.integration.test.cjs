const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { after, before, beforeEach, test } = require("node:test");
const dotenv = require("dotenv");
const { Client } = require("pg");

dotenv.config({ path: path.resolve(__dirname, "../.env"), quiet: true });

for (const emailEnvironmentKey of ["SMTP_HOST", "SMTP_PORT", "SMTP_SECURE", "SMTP_USER", "SMTP_PASSWORD", "EMAIL_FROM"]) {
  delete process.env[emailEnvironmentKey];
}

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
process.env.LOGIN_MAX_FAILED_ATTEMPTS = "3";
process.env.LOGIN_FAILED_ATTEMPT_WINDOW_MINUTES = "15";
process.env.LOGIN_LOCKOUT_MINUTES = "1";
process.env.LOGIN_RATE_LIMIT_MAX = "1000";
process.env.LOGIN_RATE_LIMIT_WINDOW_MINUTES = "15";

const app = require("../dist/app.js").default;
const { pool } = require("../dist/config/db.js");
const { bootstrapSystemAdmin } = require("../dist/services/bootstrap.service.js");
const { hashPassword } = require("../dist/utils/password.js");

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
    headers: response.headers,
    body: await response.json(),
  };
};

const validUser = {
  firstName: "Mawuli",
  lastName: "Ayikpa",
  email: "mawuli@example.com",
  role: "Manager",
  password: "Password123",
};

const createUser = async (overrides = {}) => {
  const user = { ...validUser, ...overrides };
  const passwordHash = await hashPassword(user.password);
  const result = await pool.query(
    `INSERT INTO users (first_name, last_name, email, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, first_name, last_name, email, role, created_at`,
    [user.firstName, user.lastName, user.email.toLowerCase(), passwordHash, user.role],
  );
  return result.rows[0];
};

const loginUser = (overrides = {}) => apiRequest("/api/auth/login", {
  method: "POST",
  body: {
    email: validUser.email,
    password: validUser.password,
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
  await pool.query("TRUNCATE TABLE audit_logs, sale_items, sales, products, users RESTART IDENTITY CASCADE");
});

after(async () => {
  try {
    if (databaseReady) {
      await pool.query("TRUNCATE TABLE audit_logs, sale_items, sales, products, users RESTART IDENTITY CASCADE");
    }
  } finally {
    await stopServer();
    await pool.end();
  }
});

test("public account registration is unavailable", async () => {
  const response = await apiRequest("/api/auth/register", {
    method: "POST",
    body: { ...validUser, confirmPassword: validUser.password },
  });
  assert.equal(response.status, 404);
  assert.equal(response.body.message, "Route not found.");

  const stored = await pool.query("SELECT COUNT(*) AS count FROM users");
  assert.equal(Number(stored.rows[0].count), 0);
});

test("login returns a JWT and public profile while rejecting invalid credentials", async () => {
  await createUser();

  const loggedIn = await loginUser();
  assert.equal(loggedIn.status, 200);
  assert.equal(loggedIn.body.message, "Login successful");
  assert.equal(typeof loggedIn.body.token, "string");
  assert.ok(loggedIn.body.token.length > 20);
  assert.equal(loggedIn.body.user.email, validUser.email);
  assert.equal(loggedIn.body.user.role, validUser.role);
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

test("repeated failed logins lock an account until SystemAdmin unlocks it", async () => {
  const employee = await createUser();

  const firstFailure = await loginUser({ password: "WrongPassword123" });
  const secondFailure = await loginUser({ password: "WrongPassword123" });
  const lockingFailure = await loginUser({ password: "WrongPassword123" });
  assert.equal(firstFailure.status, 401);
  assert.equal(secondFailure.status, 401);
  assert.equal(lockingFailure.status, 429);
  assert.match(lockingFailure.body.message, /too many unsuccessful/i);

  const lockedLogin = await loginUser();
  assert.equal(lockedLogin.status, 429);
  const lockedRecord = await pool.query(
    `SELECT failed_login_attempts,
            locked_until > NOW() AS "lockedInFuture"
     FROM users WHERE id = $1`,
    [employee.id],
  );
  assert.equal(lockedRecord.rows[0].failed_login_attempts, 3);
  assert.equal(lockedRecord.rows[0].lockedInFuture, true);

  const systemCredentials = {
    firstName: "System",
    lastName: "Administrator",
    email: "system-admin@example.com",
    password: "SecureAdmin123!",
  };
  await bootstrapSystemAdmin(systemCredentials);
  const systemLogin = await loginUser({ email: systemCredentials.email, password: systemCredentials.password });
  const unlocked = await apiRequest(`/api/employees/${employee.id}/unlock`, {
    method: "PATCH",
    token: systemLogin.body.token,
  });
  assert.equal(unlocked.status, 200);
  assert.equal(unlocked.body.employee.isLocked, false);
  assert.equal(unlocked.body.employee.failedLoginAttempts, 0);

  const restoredLogin = await loginUser();
  assert.equal(restoredLogin.status, 200);
  const clearedRecord = await pool.query(
    "SELECT failed_login_attempts, last_failed_login_at, locked_until FROM users WHERE id = $1",
    [employee.id],
  );
  assert.equal(clearedRecord.rows[0].failed_login_attempts, 0);
  assert.equal(clearedRecord.rows[0].last_failed_login_at, null);
  assert.equal(clearedRecord.rows[0].locked_until, null);
});

test("me requires a valid JWT and returns the authenticated user", async () => {
  await createUser();
  const loggedIn = await loginUser();

  const missingToken = await apiRequest("/api/auth/me");
  assert.equal(missingToken.status, 401);

  const invalidToken = await apiRequest("/api/auth/me", { token: "invalid-token" });
  assert.equal(invalidToken.status, 401);

  const currentUser = await apiRequest("/api/auth/me", { token: loggedIn.body.token });
  assert.equal(currentUser.status, 200);
  assert.equal(currentUser.headers.get("cache-control"), "no-store");
  assert.equal(currentUser.body.user.email, validUser.email);
  assert.equal(currentUser.body.user.role, "Manager");
  assert.equal("passwordHash" in currentUser.body.user, false);
});

test("the one-time bootstrap creates a SystemAdmin with management access", async () => {
  const credentials = {
    firstName: "System",
    lastName: "Administrator",
    email: "system-admin@example.com",
    password: "SecureAdmin123!",
  };
  const bootstrapped = await bootstrapSystemAdmin(credentials);
  assert.equal(bootstrapped.role, "SystemAdmin");

  await assert.rejects(bootstrapSystemAdmin({ ...credentials, email: "second-admin@example.com" }), /already exists/i);

  const loggedIn = await loginUser({ email: credentials.email, password: credentials.password });
  assert.equal(loggedIn.status, 200);
  assert.equal(loggedIn.body.user.role, "SystemAdmin");

  const sidebar = await apiRequest("/api/dashboard/sidebar", { token: loggedIn.body.token });
  assert.equal(sidebar.status, 200);
  assert.equal(sidebar.body.role, "SystemAdmin");
  assert.ok(sidebar.body.menuItems.some((item) => item.path === "/dashboard/products"));

  const products = await apiRequest("/api/products", { token: loggedIn.body.token });
  assert.equal(products.status, 200);
  assert.deepEqual(products.body.pagination, { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 });
});

test("SystemAdmin manages employees while Manager access and disabled accounts are blocked", async () => {
  const systemCredentials = {
    firstName: "System",
    lastName: "Administrator",
    email: "system-admin@example.com",
    password: "SecureAdmin123!",
  };
  const systemAdmin = await bootstrapSystemAdmin(systemCredentials);
  const systemLogin = await loginUser({ email: systemCredentials.email, password: systemCredentials.password });
  const systemToken = systemLogin.body.token;

  const employeeInput = {
    firstName: "Marcus",
    lastName: "Cole",
    email: "marcus@example.com",
    role: "Manager",
    password: "Temporary123!",
    confirmPassword: "Temporary123!",
  };
  const created = await apiRequest("/api/employees", { method: "POST", token: systemToken, body: employeeInput });
  assert.equal(created.status, 201);
  assert.equal(created.body.employee.role, "Manager");
  assert.equal(created.body.employee.status, "Active");
  assert.equal(created.body.employee.mustChangePassword, true);
  assert.equal(created.body.employee.createdBy, "System Administrator");
  const employeeId = created.body.employee.id;

  const stored = await pool.query(
    "SELECT password_hash, account_status, created_by, must_change_password FROM users WHERE id = $1",
    [employeeId],
  );
  assert.notEqual(stored.rows[0].password_hash, employeeInput.password);
  assert.equal(stored.rows[0].account_status, "active");
  assert.equal(stored.rows[0].created_by, systemAdmin.id);
  assert.equal(stored.rows[0].must_change_password, true);

  const duplicate = await apiRequest("/api/employees", { method: "POST", token: systemToken, body: employeeInput });
  assert.equal(duplicate.status, 409);
  const forbiddenRole = await apiRequest("/api/employees", {
    method: "POST",
    token: systemToken,
    body: { ...employeeInput, email: "another@example.com", role: "SystemAdmin" },
  });
  assert.equal(forbiddenRole.status, 400);

  const managerLogin = await loginUser({ email: employeeInput.email, password: employeeInput.password });
  assert.equal(managerLogin.status, 200);
  assert.equal(managerLogin.body.user.mustChangePassword, true);
  const temporaryManagerToken = managerLogin.body.token;
  const currentEmployee = await apiRequest("/api/auth/me", { token: temporaryManagerToken });
  assert.equal(currentEmployee.status, 200);
  assert.equal(currentEmployee.body.user.mustChangePassword, true);
  const blockedDashboard = await apiRequest("/api/dashboard", { token: temporaryManagerToken });
  assert.equal(blockedDashboard.status, 403);
  assert.equal(blockedDashboard.body.code, "PASSWORD_CHANGE_REQUIRED");

  const rejectedChange = await apiRequest("/api/auth/change-password", {
    method: "POST",
    token: temporaryManagerToken,
    body: { currentPassword: "Incorrect123!", newPassword: "PersonalPassword123!", confirmPassword: "PersonalPassword123!" },
  });
  assert.equal(rejectedChange.status, 400);
  assert.equal(rejectedChange.body.message, "Current password is incorrect.");

  const personalPassword = "PersonalPassword123!";
  const changedPassword = await apiRequest("/api/auth/change-password", {
    method: "POST",
    token: temporaryManagerToken,
    body: { currentPassword: employeeInput.password, newPassword: personalPassword, confirmPassword: personalPassword },
  });
  assert.equal(changedPassword.status, 200);
  assert.equal(changedPassword.body.user.mustChangePassword, false);
  assert.equal(typeof changedPassword.body.token, "string");
  const revokedTemporarySession = await apiRequest("/api/auth/me", { token: temporaryManagerToken });
  assert.equal(revokedTemporarySession.status, 401);
  const managerToken = changedPassword.body.token;
  const availableDashboard = await apiRequest("/api/dashboard", { token: managerToken });
  assert.equal(availableDashboard.status, 200);

  const rejectedTemporaryLogin = await loginUser({ email: employeeInput.email, password: employeeInput.password });
  assert.equal(rejectedTemporaryLogin.status, 401);
  const personalLogin = await loginUser({ email: employeeInput.email, password: personalPassword });
  assert.equal(personalLogin.status, 200);
  assert.equal(personalLogin.body.user.mustChangePassword, false);

  const forbiddenList = await apiRequest("/api/employees", { token: managerToken });
  assert.equal(forbiddenList.status, 403);

  const filteredList = await apiRequest("/api/employees?q=marcus&role=Manager&status=Active", { token: systemToken });
  assert.equal(filteredList.status, 200);
  assert.equal(filteredList.body.employees.length, 1);
  assert.equal(filteredList.body.employees[0].email, employeeInput.email);

  const changedRole = await apiRequest(`/api/employees/${employeeId}/role`, {
    method: "PATCH",
    token: systemToken,
    body: { role: "Cashier" },
  });
  assert.equal(changedRole.status, 200);
  assert.equal(changedRole.body.employee.role, "Cashier");

  const currentSidebar = await apiRequest("/api/dashboard/sidebar", { token: managerToken });
  assert.equal(currentSidebar.status, 200);
  assert.equal(currentSidebar.body.role, "Cashier");

  const disabled = await apiRequest(`/api/employees/${employeeId}/status`, {
    method: "PATCH",
    token: systemToken,
    body: { status: "Disabled" },
  });
  assert.equal(disabled.status, 200);
  assert.equal(disabled.body.employee.status, "Disabled");

  const rejectedExistingSession = await apiRequest("/api/auth/me", { token: managerToken });
  assert.equal(rejectedExistingSession.status, 401);
  const rejectedLogin = await loginUser({ email: employeeInput.email, password: personalPassword });
  assert.equal(rejectedLogin.status, 403);
  assert.match(rejectedLogin.body.message, /disabled/i);

  const enabled = await apiRequest(`/api/employees/${employeeId}/status`, {
    method: "PATCH",
    token: systemToken,
    body: { status: "Active" },
  });
  assert.equal(enabled.status, 200);
  const restoredLogin = await loginUser({ email: employeeInput.email, password: personalPassword });
  assert.equal(restoredLogin.status, 200);
  assert.equal(restoredLogin.body.user.role, "Cashier");

  const forcedLogout = await apiRequest(`/api/employees/${employeeId}/revoke-sessions`, {
    method: "PATCH",
    token: systemToken,
  });
  assert.equal(forcedLogout.status, 200);
  const rejectedRevokedSession = await apiRequest("/api/auth/me", { token: restoredLogin.body.token });
  assert.equal(rejectedRevokedSession.status, 401);
  assert.match(rejectedRevokedSession.body.message, /revoked/i);
  const postRevocationLogin = await loginUser({ email: employeeInput.email, password: personalPassword });
  assert.equal(postRevocationLogin.status, 200);

  const replacementTemporaryPassword = "Replacement456!";
  const resetBySystemAdmin = await apiRequest(`/api/employees/${employeeId}/password`, {
    method: "PATCH",
    token: systemToken,
    body: { password: replacementTemporaryPassword, confirmPassword: replacementTemporaryPassword },
  });
  assert.equal(resetBySystemAdmin.status, 200);
  assert.equal(resetBySystemAdmin.body.employee.mustChangePassword, true);
  const blockedExistingSession = await apiRequest("/api/auth/me", { token: postRevocationLogin.body.token });
  assert.equal(blockedExistingSession.status, 401);
  const replacementLogin = await loginUser({ email: employeeInput.email, password: replacementTemporaryPassword });
  assert.equal(replacementLogin.status, 200);
  assert.equal(replacementLogin.body.user.mustChangePassword, true);

  const protectedSystemAdmin = await apiRequest(`/api/employees/${systemAdmin.id}/status`, {
    method: "PATCH",
    token: systemToken,
    body: { status: "Disabled" },
  });
  assert.equal(protectedSystemAdmin.status, 400);
});

test("protected API authorization follows the SystemAdmin, Manager, and Cashier role matrix", async () => {
  const systemCredentials = {
    firstName: "System",
    lastName: "Administrator",
    email: "system-admin@example.com",
    password: "SecureAdmin123!",
  };
  await bootstrapSystemAdmin(systemCredentials);
  await createUser({ email: "manager@example.com", role: "Manager" });
  await createUser({ email: "cashier@example.com", role: "Cashier" });

  const systemLogin = await loginUser({ email: systemCredentials.email, password: systemCredentials.password });
  const managerLogin = await loginUser({ email: "manager@example.com" });
  const cashierLogin = await loginUser({ email: "cashier@example.com" });

  const modules = [
    { route: "/api/dashboard", SystemAdmin: 200, Manager: 200, Cashier: 200 },
    { route: "/api/sales", SystemAdmin: 200, Manager: 200, Cashier: 200 },
    { route: "/api/products", SystemAdmin: 200, Manager: 200, Cashier: 403 },
    { route: "/api/reports", SystemAdmin: 200, Manager: 200, Cashier: 403 },
    { route: "/api/employees", SystemAdmin: 200, Manager: 403, Cashier: 403 },
    { route: "/api/audit-logs", SystemAdmin: 200, Manager: 403, Cashier: 403 },
  ];
  const tokens = {
    SystemAdmin: systemLogin.body.token,
    Manager: managerLogin.body.token,
    Cashier: cashierLogin.body.token,
  };

  for (const module of modules) {
    const anonymous = await apiRequest(module.route);
    assert.equal(anonymous.status, 401, `${module.route} must reject anonymous requests`);
    for (const role of ["SystemAdmin", "Manager", "Cashier"]) {
      const response = await apiRequest(module.route, { token: tokens[role] });
      assert.equal(response.status, module[role], `${role} access to ${module.route}`);
    }
  }
});

test("audit logs persist safe operational events and remain SystemAdmin-only", async () => {
  const systemCredentials = {
    firstName: "System",
    lastName: "Administrator",
    email: "system-admin@example.com",
    password: "SecureAdmin123!",
  };
  await bootstrapSystemAdmin(systemCredentials);
  const systemLogin = await loginUser({ email: systemCredentials.email, password: systemCredentials.password });
  const systemToken = systemLogin.body.token;

  const temporaryPassword = "Temporary123!";
  const createdEmployee = await apiRequest("/api/employees", {
    method: "POST",
    token: systemToken,
    body: {
      firstName: "Audit",
      lastName: "Manager",
      email: "audit-manager@example.com",
      role: "Manager",
      password: temporaryPassword,
      confirmPassword: temporaryPassword,
    },
  });
  assert.equal(createdEmployee.status, 201);

  const managerLogin = await loginUser({ email: "audit-manager@example.com", password: temporaryPassword });
  const changedPassword = "PersonalPassword123!";
  const passwordChange = await apiRequest("/api/auth/change-password", {
    method: "POST",
    token: managerLogin.body.token,
    body: { currentPassword: temporaryPassword, newPassword: changedPassword, confirmPassword: changedPassword },
  });
  assert.equal(passwordChange.status, 200);

  const createdProduct = await apiRequest("/api/products", {
    method: "POST",
    token: passwordChange.body.token,
    body: {
      name: "Audited Rice",
      category: "Food",
      costPrice: 20,
      sellingPrice: 25,
      quantityInStock: 10,
      reorderLevel: 2,
    },
  });
  assert.equal(createdProduct.status, 201);

  const sale = await apiRequest("/api/sales", {
    method: "POST",
    token: passwordChange.body.token,
    body: { items: [{ productId: createdProduct.body.product.id, quantity: 2 }] },
  });
  assert.equal(sale.status, 201);

  const failedLogin = await loginUser({ email: "audit-manager@example.com", password: "WrongPassword123!" });
  assert.equal(failedLogin.status, 401);

  const logs = await apiRequest("/api/audit-logs", { token: systemToken });
  assert.equal(logs.status, 200);
  const actions = new Set(logs.body.auditLogs.map((log) => log.action));
  for (const expectedAction of [
    "AUTH_LOGIN_SUCCESS",
    "AUTH_LOGIN_FAILURE",
    "AUTH_PASSWORD_CHANGED",
    "EMPLOYEE_CREATED",
    "PRODUCT_CREATED",
    "SALE_COMPLETED",
  ]) {
    assert.equal(actions.has(expectedAction), true, `missing ${expectedAction} audit event`);
  }

  const employeeEvents = await apiRequest("/api/audit-logs?action=EMPLOYEE_CREATED&outcome=success&q=audit-manager", { token: systemToken });
  assert.equal(employeeEvents.status, 200);
  assert.equal(employeeEvents.body.auditLogs.length, 1);
  assert.equal(employeeEvents.body.auditLogs[0].actorEmail, systemCredentials.email);
  assert.equal(employeeEvents.body.auditLogs[0].targetEmail, "audit-manager@example.com");
  assert.equal(employeeEvents.body.auditLogs[0].details.role, "Manager");

  const invalidFilter = await apiRequest("/api/audit-logs?action=NOT_A_REAL_ACTION", { token: systemToken });
  assert.equal(invalidFilter.status, 400);

  const storedDetails = await pool.query("SELECT details::text AS details FROM audit_logs");
  const serializedDetails = storedDetails.rows.map((row) => row.details).join(" ");
  assert.equal(serializedDetails.includes(temporaryPassword), false);
  assert.equal(serializedDetails.includes(changedPassword), false);
  assert.equal(serializedDetails.toLowerCase().includes("resettoken"), false);
});

test("forgot-password stores an expiring token hash and keeps responses generic", async () => {
  await createUser();

  const existingAccount = await apiRequest("/api/auth/forgot-password", {
    method: "POST",
    body: { email: validUser.email },
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
    [validUser.email],
  );
  assert.equal(stored.rowCount, 1);
  assert.equal(
    stored.rows[0].reset_token,
    createHash("sha256").update(rawToken).digest("hex"),
  );
  assert.equal(stored.rows[0].expiresInFuture, true);
});

test("production forgot-password responses never expose the reset token", async () => {
  await createUser();
  const previousNodeEnvironment = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    const response = await apiRequest("/api/auth/forgot-password", {
      method: "POST",
      body: { email: validUser.email },
    });
    assert.equal(response.status, 200);
    assert.equal("resetUrl" in response.body, false);
    assert.match(response.body.message, /if an account exists/i);
  } finally {
    process.env.NODE_ENV = previousNodeEnvironment;
  }
});

test("reset-password changes the password, clears the token, and prevents reuse", async () => {
  await createUser();
  await pool.query("UPDATE users SET must_change_password = TRUE WHERE email = $1", [validUser.email]);
  const sessionBeforeReset = await loginUser();
  assert.equal(sessionBeforeReset.status, 200);
  await pool.query(
    `UPDATE users
     SET failed_login_attempts = 3,
         last_failed_login_at = NOW(),
         locked_until = NOW() + INTERVAL '1 minute'
     WHERE email = $1`,
    [validUser.email],
  );
  const forgotPassword = await apiRequest("/api/auth/forgot-password", {
    method: "POST",
    body: { email: validUser.email },
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
  assert.equal(newLogin.body.user.mustChangePassword, false);
  const revokedSession = await apiRequest("/api/auth/me", { token: sessionBeforeReset.body.token });
  assert.equal(revokedSession.status, 401);

  const stored = await pool.query(
    "SELECT reset_token, reset_token_expires, failed_login_attempts, locked_until FROM users WHERE email = $1",
    [validUser.email],
  );
  assert.equal(stored.rows[0].reset_token, null);
  assert.equal(stored.rows[0].reset_token_expires, null);
  assert.equal(stored.rows[0].failed_login_attempts, 0);
  assert.equal(stored.rows[0].locked_until, null);

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
  await createUser();
  const forgotPassword = await apiRequest("/api/auth/forgot-password", {
    method: "POST",
    body: { email: validUser.email },
  });
  const resetToken = new URL(forgotPassword.body.resetUrl).searchParams.get("resetToken");

  await pool.query(
    "UPDATE users SET reset_token_expires = NOW() - INTERVAL '1 minute' WHERE email = $1",
    [validUser.email],
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
  await createUser();
  const managerLogin = await loginUser();
  const token = managerLogin.body.token;

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

  const productPage = await apiRequest("/api/products?q=Rice&page=1&pageSize=1", { token });
  assert.equal(productPage.status, 200);
  assert.equal(productPage.body.products[0].name, "Rice");
  assert.deepEqual(productPage.body.pagination, { page: 1, pageSize: 1, totalItems: 1, totalPages: 1 });

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
  assert.deepEqual(history.body.pagination, { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 });
  assert.deepEqual(history.body.summary, { transactionCount: 1, totalValue: 110 });

  const filteredHistory = await apiRequest("/api/sales?q=Rice&page=1&pageSize=1", { token });
  assert.equal(filteredHistory.status, 200);
  assert.equal(filteredHistory.body.sales.length, 1);
  assert.equal(filteredHistory.body.pagination.pageSize, 1);

  const emptyHistory = await apiRequest("/api/sales?q=Not-A-Sold-Product", { token });
  assert.equal(emptyHistory.status, 200);
  assert.equal(emptyHistory.body.sales.length, 0);
  assert.equal(emptyHistory.body.pagination.totalItems, 0);

  const invalidSaleDate = await apiRequest("/api/sales?date=06-08-2026", { token });
  assert.equal(invalidSaleDate.status, 400);

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
  assert.equal(report.body.cashiers[0].email, validUser.email);

  const datedReport = await apiRequest("/api/reports?fromDate=2999-01-01&toDate=2999-01-02", { token });
  assert.equal(datedReport.status, 200);
  assert.equal(datedReport.body.summary.transactions, 0);

  const receiptSearch = await apiRequest(`/api/search?q=${encodeURIComponent(checkout.body.sale.receiptNumber)}`, { token });
  assert.equal(receiptSearch.status, 200);
  assert.equal(receiptSearch.body.results.receipts[0].saleId, saleId);
});

test("cashiers only retrieve their own sales and cannot access reports", async () => {
  await createUser();
  const managerLogin = await loginUser();
  const createdProduct = await apiRequest("/api/products", {
    method: "POST",
    token: managerLogin.body.token,
    body: {
      name: "Sugar",
      category: "Food",
      costPrice: 7,
      sellingPrice: 10,
      quantityInStock: 10,
      reorderLevel: 2,
    },
  });

  await createUser({
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

  await createUser({
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
