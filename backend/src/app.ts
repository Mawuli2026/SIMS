import "dotenv/config";
import cors from "cors";
import compression from "compression";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { checkDatabaseConnection } from "./config/db";
import { getTrustProxyHops } from "./config/loginSecurity";
import auditRouter from "./routes/audit.routes";
import authRouter from "./routes/auth.routes";
import dashboardRouter from "./routes/dashboard.routes";
import employeeRouter from "./routes/employee.routes";
import profileRouter from "./routes/profile.routes";
import productRouter from "./routes/product.routes";
import reportRouter from "./routes/report.routes";
import saleRouter from "./routes/sale.routes";
import searchRouter from "./routes/search.routes";

const app = express();
const trustProxyHops = getTrustProxyHops();
if (trustProxyHops > 0) app.set("trust proxy", trustProxyHops);

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL ?? "http://localhost:5173" }));
app.use(compression({ threshold: 512 }));
app.use("/api", (_request: Request, response: Response, next: NextFunction) => {
  response.setHeader("Cache-Control", "no-store");
  next();
});
app.use(express.json({ limit: "100kb" }));
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

app.get("/api/health", async (_request: Request, response: Response) => {
  try {
    const databaseTime = await checkDatabaseConnection();
    response.status(200).json({ status: "ok", database: "connected", databaseTime });
  } catch {
    response.status(503).json({ status: "degraded", database: "unavailable" });
  }
});

app.use("/api/auth", authRouter);
app.use("/api/audit-logs", auditRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/employees", employeeRouter);
app.use("/api/profile", profileRouter);
app.use("/api/products", productRouter);
app.use("/api/reports", reportRouter);
app.use("/api/sales", saleRouter);
app.use("/api/search", searchRouter); 
app.use((_request: Request, response: Response) => {
  response.status(404).json({ message: "Route not found." });
});

app.use((error: Error, _request: Request, response: Response, _next: NextFunction) => {
  console.error(error);
  response.status(500).json({ message: "Internal server error." });
});

export default app;
