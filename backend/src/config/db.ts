import "dotenv/config";
import { Pool, QueryResult, QueryResultRow } from "pg";

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL is not configured. Database requests will fail until it is set.");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error.message);
});

export const query = <T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []): Promise<QueryResult<T>> =>
  pool.query<T>(text, params);

export const checkDatabaseConnection = async () => {
  const result = await query<{ currentTime: Date }>("SELECT NOW() AS \"currentTime\"");
  return result.rows[0].currentTime;
};
