const assert = require("node:assert/strict");
const { test } = require("node:test");
const { comparePassword } = require("../dist/utils/password.js");
const {
  bootstrapSystemAdminSchema,
  bootstrapSystemAdminWithClient,
  BootstrapSystemAdminError,
} = require("../dist/services/bootstrap.service.js");

const input = {
  firstName: "Alicia",
  lastName: "Ng",
  email: "SYSTEM-ADMIN@SIMS.COM",
  password: "SecureAdmin123!",
};

const createClient = ({ existingSystemAdmin = false, existingEmail = false } = {}) => {
  const calls = [];
  return {
    calls,
    async query(sql, params = []) {
      const normalized = String(sql).replace(/\s+/g, " ").trim();
      calls.push({ sql: normalized, params });
      if (["BEGIN", "COMMIT", "ROLLBACK"].includes(normalized)) return { rows: [], rowCount: null };
      if (normalized.startsWith("SELECT pg_advisory_xact_lock")) return { rows: [{}], rowCount: 1 };
      if (normalized.includes("WHERE role = 'SystemAdmin'")) return { rows: existingSystemAdmin ? [{ id: 1 }] : [], rowCount: existingSystemAdmin ? 1 : 0 };
      if (normalized.includes("WHERE email = $1")) return { rows: existingEmail ? [{ id: 2 }] : [], rowCount: existingEmail ? 1 : 0 };
      if (normalized.startsWith("INSERT INTO users")) return { rows: [{
        id: 3,
        first_name: "Alicia",
        last_name: "Ng",
        email: "system-admin@sims.com",
        role: "SystemAdmin",
        created_at: new Date("2026-08-03T00:00:00.000Z"),
      }], rowCount: 1 };
      throw new Error(`Unexpected SQL: ${normalized}`);
    },
  };
};

test("bootstrap validates strong one-time administrator credentials", () => {
  assert.equal(bootstrapSystemAdminSchema.safeParse(input).success, true);
  const weakPassword = bootstrapSystemAdminSchema.safeParse({ ...input, password: "short" });
  assert.equal(weakPassword.success, false);
  assert.equal(weakPassword.error.issues[0].message, "SystemAdmin password must be at least 12 characters.");
});

test("bootstrap creates one SystemAdmin with a normalized email and hashed password", async () => {
  const client = createClient();
  const user = await bootstrapSystemAdminWithClient(client, input);
  const insert = client.calls.find((call) => call.sql.startsWith("INSERT INTO users"));

  assert.equal(user.role, "SystemAdmin");
  assert.equal(user.email, "system-admin@sims.com");
  assert.notEqual(insert.params[3], input.password);
  assert.equal(await comparePassword(input.password, insert.params[3]), true);
  assert.equal(client.calls.at(-1).sql, "COMMIT");
});

test("bootstrap refuses to create a second SystemAdmin and rolls back", async () => {
  const client = createClient({ existingSystemAdmin: true });
  await assert.rejects(
    bootstrapSystemAdminWithClient(client, input),
    (error) => error instanceof BootstrapSystemAdminError && /only run once/i.test(error.message),
  );
  assert.equal(client.calls.at(-1).sql, "ROLLBACK");
  assert.equal(client.calls.some((call) => call.sql.startsWith("INSERT INTO users")), false);
});
