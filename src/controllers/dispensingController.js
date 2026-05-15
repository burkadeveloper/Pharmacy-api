import StockBatch from "../models/StockBatch.js";
import Sale from "../models/Sale.js";
import DispenseRequest from "../models/DispenseRequest.js";
import DrugName from "../models/DrugName.js";

// ----------------------------------------------------------------------
// Direct Dispensing (legacy)
// ----------------------------------------------------------------------

/**
 * Search drugs by name (partial match)
 * GET /api/dispense/search?name=...
 */
export const searchDrug = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name || name.length < 2) {
      return res.json([]);
    }
    const drugs = await DrugName.find({
      name: { $regex: name, $options: "i" },
    }).populate("category");
    res.json(drugs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all batches for a given drug (with remaining stock), sorted by expiry (closest first)
 * GET /api/dispense/batches/:drugId
 */
export const getBatchesForDrug = async (req, res) => {
  try {
    const { drugId } = req.params;
    const batches = await StockBatch.find({
      drugName: drugId,
      remainingQty: { $gt: 0 },
      expiryDate: { $gt: new Date() }, // exclude expired
    }).sort("expiryDate"); // expiry-first picking
    res.json(batches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Direct dispense (without creating a request)
 * POST /api/dispense
 * Body: { batchId, quantity }
 */
export const dispense = async (req, res) => {
  try {
    const { batchId, quantity } = req.body;
    const batch = await StockBatch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }
    if (batch.remainingQty < quantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }
    if (new Date(batch.expiryDate) < new Date()) {
      return res.status(400).json({ message: "Cannot dispense expired batch" });
    }

    batch.remainingQty -= quantity;
    await batch.save();

    const sale = await Sale.create({
      stockBatch: batch._id,
      quantitySold: quantity,
      sellingPriceUsed: batch.sellingPrice,
      costPriceUsed: batch.costPrice,
    });

    res.json({
      message: "Dispensed successfully",
      sale,
      remainingQty: batch.remainingQty,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ----------------------------------------------------------------------
// Dispense Requests (Pick List)
// ----------------------------------------------------------------------

/**
 * Create a new dispense request (pick list item)
 * POST /api/dispense/requests
 * Body: { patientName, drugName, requestedQuantity, notes }
 */
export const createRequest = async (req, res) => {
  try {
    const { patientName, drugName, requestedQuantity, notes } = req.body;
    if (!drugName || !requestedQuantity) {
      return res
        .status(400)
        .json({ message: "Drug and quantity are required" });
    }
    const request = await DispenseRequest.create({
      patientName: patientName || "",
      drugName,
      requestedQuantity,
      notes: notes || "",
      status: "Pending",
    });
    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all pending requests
 * GET /api/dispense/requests/pending
 */
export const getPendingRequests = async (req, res) => {
  try {
    const requests = await DispenseRequest.find({ status: "Pending" })
      .populate("drugName")
      .populate("selectedBatch")
      .sort("-createdAt");
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all requests (history)
 * GET /api/dispense/requests/all
 */
export const getAllRequests = async (req, res) => {
  try {
    const requests = await DispenseRequest.find()
      .populate("drugName")
      .populate("selectedBatch")
      .sort("-createdAt");
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get recommended batches for a drug (shortest expiry first, sufficient stock, not expired)
 * GET /api/dispense/recommended/:drugId
 */
export const getRecommendedBatches = async (req, res) => {
  try {
    const { drugId } = req.params;
    const batches = await StockBatch.find({
      drugName: drugId,
      remainingQty: { $gt: 0 },
      expiryDate: { $gt: new Date() },
    }).sort("expiryDate"); // closest expiry first
    res.json(batches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Fulfill a pending request: select a batch, reduce stock, record sale, mark request completed
 * POST /api/dispense/requests/fulfill
 * Body: { requestId, batchId, finalQuantity }
 */
export const fulfillRequest = async (req, res) => {
  try {
    const { requestId, batchId, finalQuantity } = req.body;

    const request = await DispenseRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    if (request.status !== "Pending") {
      return res.status(400).json({ message: "Request already processed" });
    }

    const batch = await StockBatch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }
    if (batch.remainingQty < finalQuantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }
    if (new Date(batch.expiryDate) < new Date()) {
      return res.status(400).json({ message: "Batch expired" });
    }

    // Reduce stock
    batch.remainingQty -= finalQuantity;
    await batch.save();

    // Record sale
    await Sale.create({
      stockBatch: batch._id,
      quantitySold: finalQuantity,
      sellingPriceUsed: batch.sellingPrice,
      costPriceUsed: batch.costPrice,
    });

    // Update request
    request.selectedBatch = batch._id;
    request.status = "Completed";
    await request.save();

    res.json({ message: "Request fulfilled", request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Cancel a pending request
 * DELETE /api/dispense/requests/:id
 */
export const cancelRequest = async (req, res) => {
  try {
    const request = await DispenseRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    if (request.status !== "Pending") {
      return res
        .status(400)
        .json({ message: "Only pending requests can be cancelled" });
    }
    request.status = "Cancelled";
    await request.save();
    res.json({ message: "Request cancelled" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ----------------------------------------------------------------------
// QR Code Lookup
// ----------------------------------------------------------------------

/**
 * Get batch by QR code string
 * GET /api/dispense/qr/:qr
 */
export const getBatchByQR = async (req, res) => {
  try {
    const batch = await StockBatch.findOne({ qrCode: req.params.qr }).populate(
      "drugName",
    );
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }
    res.json(batch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
