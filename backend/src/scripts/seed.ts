import "dotenv/config";
import { pool, query } from "../config/db";
import { hashPassword } from "../utils/password";
import { UserRole } from "../types/auth.types";

interface SeedAccount {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
}

const DEFAULT_PASSWORD = "secrete123";

const accounts: SeedAccount[] = [
  { firstName: "Admin", lastName: "User", email: "admin@sims.com", password: DEFAULT_PASSWORD, role: "Admin" },
  { firstName: "Cashier", lastName: "User", email: "cashier@sims.com", password: DEFAULT_PASSWORD, role: "Cashier" },
];

const seedAccount = async (account: SeedAccount) => {
  const email = account.email.trim().toLowerCase();
  const passwordHash = await hashPassword(account.password);

  await query(
    `INSERT INTO users (first_name, last_name, email, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO UPDATE
     SET password_hash = EXCLUDED.password_hash,
         role = EXCLUDED.role,
         updated_at = CURRENT_TIMESTAMP`,
    [account.firstName, account.lastName, email, passwordHash, account.role],
  );

  console.log(`Seeded ${account.role} account -> ${email} / ${account.password}`);
};

const run = async () => {
  try {
    for (const account of accounts) {
      // Sequential on purpose: clearer log ordering, and this only ever runs a handful of times.
      // eslint-disable-next-line no-await-in-loop
      await seedAccount(account);
    }
    console.log("Done. You can now log in with either account above.");
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

void run();
