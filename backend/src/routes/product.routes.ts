import { Router } from "express";
import {
  createProduct,
  listLowStockProducts,
  listProducts,
  updateProduct,
  updateProductStatus,
} from "../controllers/product.controller";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware";

const productRouter = Router();

productRouter.use(authenticate, authorizeRoles("Admin"));
productRouter.get("/low-stock", listLowStockProducts);
productRouter.get("/", listProducts);
productRouter.post("/", createProduct);
productRouter.patch("/:productId", updateProduct);
productRouter.patch("/:productId/status", updateProductStatus);

export default productRouter;
