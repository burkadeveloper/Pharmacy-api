import mongoose from "mongoose";

// const drugNameSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true, unique: true },
//     brand: { type: String, default: "" },
//     category: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Category",
//       required: true,
//     },
//     shelfLocation: { type: String, default: "" },
//     minStockThreshold: { type: Number, default: 10 },
//   },
//   { timestamps: true },
// );
const drugNameSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    brand: { type: String, default: "" }, // NEW: brand name
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    shelfLocation: { type: String, default: "" },
    minStockThreshold: { type: Number, default: 10 },
  },
  { timestamps: true },
);

// Unique compound index: same name + brand combination
drugNameSchema.index({ name: 1, brand: 1 }, { unique: true });

export default mongoose.model("DrugName", drugNameSchema);
