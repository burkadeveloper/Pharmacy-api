import express from "express";
import {
  getMonthlyReport,
  getExpiryReport,
  getRevenueAnalysis,
} from "../controllers/reportController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);
router.get("/monthly", getMonthlyReport);
router.get("/expiry", getExpiryReport);
router.get("/revenue-analysis", getRevenueAnalysis);
export default router;
