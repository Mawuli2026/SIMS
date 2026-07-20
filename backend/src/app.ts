import "dotenv/config";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { checkDatabaseConnection } from "./config/db";
import authRouter from "./routes/auth.routes";

const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL ?? "http://localhost:5173" }));
app.use(express.json({ limit: "100kb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/api/health", async (_request: Request, response: Response) => {
  try {
    const databaseTime = await checkDatabaseConnection();
    response.status(200).json({ status: "ok", database: "connected", databaseTime });
  } catch {
    response.status(503).json({ status: "degraded", database: "unavailable" });
  }
});

app.use("/api/auth", authRouter);

app.use((_request: Request, response: Response) => {
  response.status(404).json({ message: "Route not found." });
});

app.use((error: Error, _request: Request, response: Response, _next: NextFunction) => {
  console.error(error);
  response.status(500).json({ message: "Internal server error." });
});

export default app;
