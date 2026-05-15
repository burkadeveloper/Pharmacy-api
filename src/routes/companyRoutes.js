import express from "express";
import {
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  getSupplierMetrics,
} from "../controllers/companyController.js";
import { protect } from "../middleware/auth.js";
const router = express.Router();

router.use(protect);
router.get("/", getCompanies);
router.post("/", createCompany);
router.put("/:id", updateCompany);
router.delete("/:id", deleteCompany);
router.get("/metrics/supplier", getSupplierMetrics);

export default router;
