import express from "express";
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  cancelOrder,
  getOrderStatusFunnel,
  getOrderLinesByDrug,
} from "../controllers/orderController.js";
import { protect } from "../middleware/auth.js";
const router = express.Router();

router.use(protect);
router.get("/", getOrders);
router.get("/status-funnel", getOrderStatusFunnel);
router.get("/:id", getOrderById);
router.post("/", createOrder);
router.put("/:id", updateOrder);
router.delete("/:id", cancelOrder);
router.get("/lines/drug/:drugId", getOrderLinesByDrug);
export default router;
