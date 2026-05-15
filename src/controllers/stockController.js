import StockBatch from "../models/StockBatch.js";
import DrugName from "../models/DrugName.js";
import Sale from "../models/Sale.js";

export const getStockBatches = async (req, res) => {
  try {
    const batches = await StockBatch.find()
      .populate("drugName")
      .sort("expiryDate");
    res.json(batches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getExpiringBatches = async (req, res) => {
  try {
    const today = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(today.getDate() + 30);
    const ninetyDays = new Date();
    ninetyDays.setDate(today.getDate() + 90);

    const expiringSoon = await StockBatch.find({
      expiryDate: { $lte: ninetyDays, $gte: today },
      remainingQty: { $gt: 0 },
    }).populate("drugName");

    const red = expiringSoon.filter((b) => b.expiryDate <= thirtyDays);
    const yellow = expiringSoon.filter(
      (b) => b.expiryDate > thirtyDays && b.expiryDate <= ninetyDays,
    );

    res.json({ red, yellow });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getLowStock = async (req, res) => {
  try {
    const drugs = await DrugName.find();
    const lowStock = [];
    for (const drug of drugs) {
      const batches = await StockBatch.find({ drugName: drug._id });
      const totalQty = batches.reduce((sum, b) => sum + b.remainingQty, 0);
      if (totalQty < drug.minStockThreshold) {
        lowStock.push({
          drug: drug.name,
          currentStock: totalQty,
          threshold: drug.minStockThreshold,
        });
      }
    }
    res.json(lowStock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const adjustStock = async (req, res) => {
  try {
    const { batchId, adjustment, reason } = req.body;
    const batch = await StockBatch.findById(batchId);
    if (!batch) return res.status(404).json({ message: "Batch not found" });
    const newQty = batch.remainingQty + adjustment;
    if (newQty < 0)
      return res.status(400).json({ message: "Cannot reduce below zero" });
    batch.remainingQty = newQty;
    await batch.save();
    // Optionally record adjustment as a negative sale or separate log
    res.json({ message: "Stock adjusted", batch });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBatchByQR = async (req, res) => {
  try {
    const batch = await StockBatch.findOne({ qrCode: req.params.qr }).populate(
      "drugName",
    );
    if (!batch) return res.status(404).json({ message: "Batch not found" });
    res.json(batch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// export const updateSellingPrice = async (req, res) => {
//   try {
//     const { batchId, sellingPrice } = req.body;
//     const batch = await StockBatch.findById(batchId);
//     if (!batch) return res.status(404).json({ message: "Batch not found" });
//     batch.sellingPrice = sellingPrice;
//     await batch.save();
//     res.json({ message: "Selling price updated", batch });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
// Add this function at the end of the file
export const updateSellingPrice = async (req, res) => {
  try {
    const { batchId, sellingPrice } = req.body;
    if (sellingPrice < 0)
      return res.status(400).json({ message: "Price cannot be negative" });

    const batch = await StockBatch.findById(batchId);
    if (!batch) return res.status(404).json({ message: "Batch not found" });

    batch.sellingPrice = sellingPrice;
    await batch.save();

    res.json({ message: "Selling price updated", batch });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
