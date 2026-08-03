import { Router } from "express";
import { searchAll } from "../controllers/search.controller";
import { authenticate } from "../middleware/auth.middleware";

const searchRouter = Router();

searchRouter.get("/", authenticate, searchAll);

export default searchRouter;
