import express from "express";
import { protect } from "../middleware/auth.js";
import {
  getDashboardKPIs,
  getRevenueChart,
  getTopDrugs,
  getSlowestDrugs,
  getExpiryForecast,
  getOrderStatusFunnel,
  getMonthlyOrderVsReceipt,
  getSupplierMetrics,
  compareSuppliersForDrug,
} from "../controllers/analyticsController.js";

const router = express.Router();

// All analytics routes require authentication
router.use(protect);

// Dashboard & KPIs
router.get("/kpis", getDashboardKPIs);
router.get("/revenue-chart", getRevenueChart);

// Drug performance
router.get("/top-drugs", getTopDrugs);
router.get("/slowest-drugs", getSlowestDrugs);

// Expiry & Stock
router.get("/expiry-forecast", getExpiryForecast);

// Orders
router.get("/order-funnel", getOrderStatusFunnel);
router.get("/monthly-order-receipt", getMonthlyOrderVsReceipt);

// Suppliers
router.get("/supplier-metrics", getSupplierMetrics);
router.get("/compare-supplier/:drugId", compareSuppliersForDrug);

export default router;
