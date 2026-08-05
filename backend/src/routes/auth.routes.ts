import { Router } from "express";
import {
  changePassword,
  forgotPassword,
  login,
  me,
  resetPassword,
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { loginRateLimit } from "../middleware/loginRateLimit.middleware";

const authRouter = Router();

authRouter.post("/login", loginRateLimit, login);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password", resetPassword);
authRouter.get("/me", authenticate, me);
authRouter.post("/change-password", authenticate, changePassword);

export default authRouter;
