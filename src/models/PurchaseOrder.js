import mongoose from "mongoose";

const orderStatus = [
  "Pending",
  "Updated",
  "Cancelled",
  "Partially Received",
  "Completed",
];

const purchaseOrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    orderDate: { type: Date, required: true, default: Date.now },
    expectedDeliveryDate: { type: Date },
    status: { type: String, enum: orderStatus, default: "Pending" },
    totalOrderedValue: { type: Number, default: 0 },
    notes: { type: String },
    receivedDate: { type: Date },
  },
  { timestamps: true },
);

// Generate orderNumber based on max existing number
purchaseOrderSchema.pre("save", async function (next) {
  if (this.isNew && !this.orderNumber) {
    const year = new Date().getFullYear();
    // Find the highest orderNumber for this year
    const lastOrder = await mongoose
      .model("PurchaseOrder")
      .findOne({
        orderNumber: { $regex: `^PO-${year}-` },
      })
      .sort({ orderNumber: -1 });
    let nextNum = 1;
    if (lastOrder) {
      const lastNum = parseInt(lastOrder.orderNumber.split("-")[2]);
      nextNum = lastNum + 1;
    }
    this.orderNumber = `PO-${year}-${String(nextNum).padStart(4, "0")}`;
  }
  next();
});

export default mongoose.model("PurchaseOrder", purchaseOrderSchema);
