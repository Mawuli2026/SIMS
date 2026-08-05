import { Router } from "express";
import { searchAll } from "../controllers/search.controller";
import { authenticate, requirePasswordChangeCompleted } from "../middleware/auth.middleware";

const searchRouter = Router();

searchRouter.get("/", authenticate, requirePasswordChangeCompleted, searchAll);

export default searchRouter;
