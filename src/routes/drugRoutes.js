import express from "express";
import {
  getDrugs,
  createDrug,
  updateDrug,
  deleteDrug,
  getCategories,
  createCategory,
} from "../controllers/drugController.js";
import { protect } from "../middleware/auth.js";
const router = express.Router();

router.use(protect);
router.get("/", getDrugs);
router.post("/", createDrug);
router.put("/:id", updateDrug);
router.delete("/:id", deleteDrug);
router.get("/categories", getCategories);
router.post("/categories", createCategory);

export default router;
