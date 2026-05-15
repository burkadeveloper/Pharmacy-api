import express from "express";
import {
  register,
  login,
  updateAdminProfile,
  setupFirstAdmin
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.put("/profile", protect, updateAdminProfile);
router.post('/setup-first-admin', setupFirstAdmin);
export default router;
