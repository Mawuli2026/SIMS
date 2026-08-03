import { Router } from "express";
import { getSalesReport } from "../controllers/report.controller";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware";

const reportRouter = Router();

reportRouter.get("/", authenticate, authorizeRoles("Admin"), getSalesReport);

export default reportRouter;
