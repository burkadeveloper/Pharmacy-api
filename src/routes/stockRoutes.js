import express from "express";
import {
  getStockBatches,
  getExpiringBatches,
  getLowStock,
  adjustStock,
  getBatchByQR,
  updateSellingPrice,
} from "../controllers/stockController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);
router.get("/", getStockBatches);
router.get("/expiring", getExpiringBatches);
router.get("/low-stock", getLowStock);
router.post("/adjust", adjustStock);
router.get("/qr/:qr", getBatchByQR);
router.put("/price", updateSellingPrice);

export default router;
