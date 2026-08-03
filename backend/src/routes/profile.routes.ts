import { Router } from "express";
import { me } from "../controllers/profile.controller";
import { authenticate } from "../middleware/auth.middleware";

const profileRouter = Router();

profileRouter.get("/me", authenticate, me);

export default profileRouter;
