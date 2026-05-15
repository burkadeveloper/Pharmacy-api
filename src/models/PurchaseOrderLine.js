import mongoose from "mongoose";

const purchaseOrderLineSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseOrder",
      required: true,
    },
    drugName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DrugName",
      required: true,
    },
    orderedQty: { type: Number, required: true, min: 0 },
    unitType: { type: String, required: true },
    unitSize: { type: String },
    batchNumber: { type: String },
    expiryDate: { type: Date },
    costPrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    receivedQty: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    discrepancyNote: { type: String },
    actualBatchNumber: { type: String },
    actualExpiryDate: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.model("PurchaseOrderLine", purchaseOrderLineSchema);
