import "dotenv/config";
import { pool } from "../config/db";
import { bootstrapSystemAdmin } from "../services/bootstrap.service";

const password = process.env.BOOTSTRAP_SYSTEM_ADMIN_PASSWORD ?? "";
delete process.env.BOOTSTRAP_SYSTEM_ADMIN_PASSWORD;

const run = async () => {
  const user = await bootstrapSystemAdmin({
    firstName: process.env.BOOTSTRAP_SYSTEM_ADMIN_FIRST_NAME ?? "",
    lastName: process.env.BOOTSTRAP_SYSTEM_ADMIN_LAST_NAME ?? "",
    email: process.env.BOOTSTRAP_SYSTEM_ADMIN_EMAIL ?? "",
    password,
  });

  console.log(`SystemAdmin account created successfully for ${user.email}.`);
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : "Unable to bootstrap the SystemAdmin account.");
  process.exitCode = 1;
}).finally(() => pool.end().catch(() => undefined));
