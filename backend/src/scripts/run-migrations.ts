import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { pool } from "../config/db";

const migrationFilePattern = /^\d+_.+\.sql$/;

const run = async () => {
  const migrationsDirectory = path.resolve(__dirname, "../../migrations");
  const migrationFiles = fs.readdirSync(migrationsDirectory)
    .filter((fileName) => migrationFilePattern.test(fileName))
    .sort();

  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    file_name VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);

  for (const fileName of migrationFiles) {
    const existing = await pool.query<{ file_name: string }>(
      "SELECT file_name FROM schema_migrations WHERE file_name = $1 LIMIT 1",
      [fileName],
    );
    if (existing.rowCount) {
      console.log(`Skipped ${fileName} (already applied).`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDirectory, fileName), "utf8");
    await pool.query(sql);
    await pool.query("INSERT INTO schema_migrations (file_name) VALUES ($1)", [fileName]);
    console.log(`Applied ${fileName}.`);
  }

  console.log("Database migrations are up to date.");
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : "Unable to apply database migrations.");
  process.exitCode = 1;
}).finally(() => pool.end().catch(() => undefined));

