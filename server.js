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

// --- CORS Configuration: Allow dynamic Vercel preview URLs ---
const allowedOrigins = [
  'http://localhost:5173',          // Vite default
  'http://localhost:3000',          // Alternative
  'http://127.0.0.1:5173',
  // Add your production frontend domains here (if any)
  // e.g., 'https://your-production-domain.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    // Allow localhost (any port)
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow any Vercel preview URL that starts with 'pharmacy-front-'
    if (origin.startsWith('https://pharmacy-front-') && origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    
    // Also allow any other explicit allowed origins (from array)
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Block everything else
    callback(new Error('CORS policy does not allow this origin.'));
  },
  credentials: true,   // if you use cookies/sessions
}));
// -----------------------------------------------------------

// Middleware
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
