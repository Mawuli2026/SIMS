import { Router } from "express";
import { completeSale, getSale, listSaleProducts, listSales } from "../controllers/sale.controller";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware";

const saleRouter = Router();

saleRouter.use(authenticate, authorizeRoles("Admin", "Cashier"));
saleRouter.get("/products", listSaleProducts);
saleRouter.get("/", listSales);
saleRouter.get("/:saleId", getSale);
saleRouter.post("/", completeSale);

export default saleRouter;
