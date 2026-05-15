import mongoose from "mongoose";

const requestStatus = ["Pending", "Completed", "Cancelled"];

const dispenseRequestSchema = new mongoose.Schema(
  {
    requestNumber: { type: String, unique: true },
    patientName: { type: String, default: "" },
    drugName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DrugName",
      required: true,
    },
    requestedQuantity: { type: Number, required: true, min: 0.001 },
    selectedBatch: { type: mongoose.Schema.Types.ObjectId, ref: "StockBatch" },
    status: { type: String, enum: requestStatus, default: "Pending" },
    notes: { type: String },
  },
  { timestamps: true },
);

// Auto-generate request number: REQ-YYYY-XXXX
dispenseRequestSchema.pre("save", async function (next) {
  if (this.isNew && !this.requestNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model("DispenseRequest").countDocuments();
    this.requestNumber = `REQ-${year}-${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

export default mongoose.model("DispenseRequest", dispenseRequestSchema);
