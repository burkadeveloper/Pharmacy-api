import mongoose from "mongoose";

const dailyRevenueSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, unique: true }, // one entry per day
    amount: { type: Number, required: true, min: 0 },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.model("DailyRevenue", dailyRevenueSchema);
