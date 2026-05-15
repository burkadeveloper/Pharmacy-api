import mongoose from "mongoose";

const saleSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    stockBatch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StockBatch",
      required: true,
    },
    quantitySold: { type: Number, required: true, min: 0.001 }, // allow decimals for liquids
    sellingPriceUsed: { type: Number, required: true },
    costPriceUsed: { type: Number, required: true },
  },
  { timestamps: true },
);

export default mongoose.model("Sale", saleSchema);
