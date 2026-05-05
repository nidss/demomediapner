import { Router, type IRouter } from "express";
import healthRouter from "./health";
import contentRouter from "./content";
import calendarRouter from "./calendar";

const router: IRouter = Router();

router.use(healthRouter);
router.use(contentRouter);
router.use(calendarRouter);

export default router;
