import "dotenv/config";
import app from "./app";
import { pool } from "./config/db";

const port = Number(process.env.PORT) || 5000;

const server = app.listen(port, () => {
  console.log(`SIMS API listening on http://localhost:${port}`);
});

const shutdown = (signal: string) => {
  console.log(`${signal} received. Closing server.`);
  server.close(() => {
    pool.end().finally(() => process.exit(0));
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
