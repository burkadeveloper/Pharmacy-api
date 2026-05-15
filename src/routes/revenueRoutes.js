import express from "express";
import {
  getRevenueSummary,
  submitDailyRevenue,
  getRevenueByDate,
} from "../controllers/revenueController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.get("/summary", getRevenueSummary);
router.post("/daily", submitDailyRevenue);
router.get("/by-date/:date", getRevenueByDate);
export default router;
