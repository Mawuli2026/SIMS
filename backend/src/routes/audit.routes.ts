import { Router } from "express";
import { listAuditLogs } from "../controllers/audit.controller";
import { authenticate, authorizeRoles, requirePasswordChangeCompleted } from "../middleware/auth.middleware";

const auditRouter = Router();

auditRouter.get("/", authenticate, requirePasswordChangeCompleted, authorizeRoles("SystemAdmin"), listAuditLogs);

export default auditRouter;
