import { Router } from "express";
import {
  createEmployee,
  listEmployees,
  resetEmployeePassword,
  revokeEmployeeSessions,
  unlockEmployeeAccount,
  updateEmployeeRole,
  updateEmployeeStatus,
} from "../controllers/employee.controller";
import { authenticate, authorizeRoles, requirePasswordChangeCompleted } from "../middleware/auth.middleware";

const employeeRouter = Router();

employeeRouter.use(authenticate, requirePasswordChangeCompleted, authorizeRoles("SystemAdmin"));
employeeRouter.get("/", listEmployees);
employeeRouter.post("/", createEmployee);
employeeRouter.patch("/:employeeId/status", updateEmployeeStatus);
employeeRouter.patch("/:employeeId/role", updateEmployeeRole);
employeeRouter.patch("/:employeeId/password", resetEmployeePassword);
employeeRouter.patch("/:employeeId/revoke-sessions", revokeEmployeeSessions);
employeeRouter.patch("/:employeeId/unlock", unlockEmployeeAccount);

export default employeeRouter;
