import express from "express";
import {
  register,
  login,
  updateAdminProfile,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.put("/profile", protect, updateAdminProfile);
export default router;
