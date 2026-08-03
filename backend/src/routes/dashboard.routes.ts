import { Router } from "express";
import { getDashboard, getNotifications, getSidebar } from "../controllers/dashboard.controller";
import { authenticate } from "../middleware/auth.middleware";

const dashboardRouter = Router();

dashboardRouter.get("/", authenticate, getDashboard);
dashboardRouter.get("/sidebar", authenticate, getSidebar);
dashboardRouter.get("/notifications", authenticate, getNotifications);

export default dashboardRouter;
