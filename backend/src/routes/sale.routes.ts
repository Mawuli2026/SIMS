import { Router } from "express";
import { completeSale, getSale, listSaleProducts, listSales } from "../controllers/sale.controller";
import { authenticate, authorizeRoles, requirePasswordChangeCompleted } from "../middleware/auth.middleware";

const saleRouter = Router();

saleRouter.use(authenticate, requirePasswordChangeCompleted, authorizeRoles("SystemAdmin", "Manager", "Cashier"));
saleRouter.get("/products", listSaleProducts);
saleRouter.get("/", listSales);
saleRouter.get("/:saleId", getSale);
saleRouter.post("/", completeSale);

export default saleRouter;
