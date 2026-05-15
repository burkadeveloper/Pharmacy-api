import express from "express";
import { protect } from "../middleware/auth.js";
import {
  searchDrug,
  getBatchesForDrug,
  dispense,
  createRequest,
  getPendingRequests,
  getAllRequests,
  fulfillRequest,
  cancelRequest,
  getRecommendedBatches,
  getBatchByQR,
} from "../controllers/dispensingController.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Direct dispensing (legacy)
router.get("/search", searchDrug);
router.get("/batches/:drugId", getBatchesForDrug);
router.post("/", dispense);

// Dispense Requests (Pick List)
router.post("/requests", createRequest);
router.get("/requests/pending", getPendingRequests);
router.get("/requests/all", getAllRequests);
router.post("/requests/fulfill", fulfillRequest);
router.delete("/requests/:id", cancelRequest);

// Recommendations & QR
router.get("/recommended/:drugId", getRecommendedBatches);
router.get("/qr/:qr", getBatchByQR); // if needed from stockController

export default router;
