import { Router } from "express";
import { me } from "../controllers/profile.controller";
import { authenticate, requirePasswordChangeCompleted } from "../middleware/auth.middleware";

const profileRouter = Router();

profileRouter.get("/me", authenticate, requirePasswordChangeCompleted, me);

export default profileRouter;
