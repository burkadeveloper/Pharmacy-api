import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    contact: { type: String },
    taxId: { type: String },
    notes: { type: String },
  },
  { timestamps: true },
);

export default mongoose.model("Company", companySchema);
