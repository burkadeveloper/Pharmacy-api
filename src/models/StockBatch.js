import mongoose from "mongoose";

const stockBatchSchema = new mongoose.Schema(
  {
    orderLine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseOrderLine",
      required: true,
    },
    drugName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DrugName",
      required: true,
    },
    batchNumber: { type: String, required: true },
    expiryDate: { type: Date, required: true },
    costPrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    unitType: { type: String, required: true },
    remainingQty: { type: Number, required: true },
    qrCode: { type: String },
    shelfLocation: { type: String },
  },
  { timestamps: true },
);

export default mongoose.model("StockBatch", stockBatchSchema);
