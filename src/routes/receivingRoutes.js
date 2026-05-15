import express from "express";
import {
  getReceivableOrders,
  verifyLine,
} from "../controllers/receivingController.js";
import { protect } from "../middleware/auth.js";
const router = express.Router();

router.use(protect);
router.get("/orders", getReceivableOrders);
router.post("/verify-line", verifyLine);

export default router;
