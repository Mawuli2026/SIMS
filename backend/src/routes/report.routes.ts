import { Router } from "express";
import { getSalesReport } from "../controllers/report.controller";
import { authenticate, authorizeRoles, requirePasswordChangeCompleted } from "../middleware/auth.middleware";

const reportRouter = Router();

reportRouter.get("/", authenticate, requirePasswordChangeCompleted, authorizeRoles("SystemAdmin", "Manager"), getSalesReport);

export default reportRouter;
