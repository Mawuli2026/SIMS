import { Router } from "express";
import {
  forgotPassword,
  login,
  me,
  register,
  resetPassword,
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password", resetPassword);
authRouter.get("/me", authenticate, me);

export default authRouter;
