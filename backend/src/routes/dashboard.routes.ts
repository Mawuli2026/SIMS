import { Router } from "express";
import { getDashboard, getNotifications, getSidebar } from "../controllers/dashboard.controller";
import { authenticate, requirePasswordChangeCompleted } from "../middleware/auth.middleware";

const dashboardRouter = Router();

dashboardRouter.use(authenticate, requirePasswordChangeCompleted);
dashboardRouter.get("/", getDashboard);
dashboardRouter.get("/sidebar", getSidebar);
dashboardRouter.get("/notifications", getNotifications);

export default dashboardRouter;
