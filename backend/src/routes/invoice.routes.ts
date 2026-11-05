import { Router } from "express";
import { createProFormaInvoice, getInvoice, listInvoices } from "../controllers/invoice.controller";
import { authenticate, authorizeRoles, requirePasswordChangeCompleted } from "../middleware/auth.middleware";

const invoiceRouter = Router();

invoiceRouter.use(authenticate, requirePasswordChangeCompleted, authorizeRoles("SystemAdmin", "Manager"));
invoiceRouter.get("/", listInvoices);
invoiceRouter.get("/:invoiceId", getInvoice);
invoiceRouter.post("/", createProFormaInvoice);

export default invoiceRouter;
