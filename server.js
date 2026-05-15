import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./src/routes/authRoutes.js";
import companyRoutes from "./src/routes/companyRoutes.js";
import drugRoutes from "./src/routes/drugRoutes.js";
import orderRoutes from "./src/routes/orderRoutes.js";
import receivingRoutes from "./src/routes/receivingRoutes.js";
import stockRoutes from "./src/routes/stockRoutes.js";
import dispensingRoutes from "./src/routes/dispensingRoutes.js";
import analyticsRoutes from "./src/routes/analyticsRoutes.js";
import reportRoutes from "./src/routes/reportRoutes.js";
import revenueRoutes from "./src/routes/revenueRoutes.js";
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/drugs", drugRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/receiving", receivingRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/dispense", dispensingRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/revenue", revenueRoutes);
// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
