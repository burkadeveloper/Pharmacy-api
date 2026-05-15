import PurchaseOrder from "../models/PurchaseOrder.js";
import PurchaseOrderLine from "../models/PurchaseOrderLine.js";
import StockBatch from "../models/StockBatch.js";
import DrugName from "../models/DrugName.js";
import { generateQR } from "../utils/qrGenerator.js";

export const getReceivableOrders = async (req, res) => {
  try {
    const orders = await PurchaseOrder.find({
      status: { $in: ["Pending", "Updated", "Partially Received"] },
    }).populate("company");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyLine = async (req, res) => {
  try {
    const {
      lineId,
      receivedQty,
      actualBatchNumber,
      actualExpiryDate,
      verified,
      discrepancyNote,
    } = req.body;

    console.log("=== VERIFY LINE RECEIVED ===");
    console.log("lineId:", lineId);
    console.log("receivedQty:", receivedQty, "type:", typeof receivedQty);
    console.log("actualBatchNumber:", actualBatchNumber);
    console.log("actualExpiryDate:", actualExpiryDate);
    console.log(
      "verified (from frontend):",
      verified,
      "type:",
      typeof verified,
    );
    console.log("discrepancyNote:", discrepancyNote);

    // Find order line
    const line = await PurchaseOrderLine.findById(lineId).populate("drugName");
    if (!line) return res.status(404).json({ message: "Order line not found" });
    console.log(
      "Line found. orderedQty:",
      line.orderedQty,
      "unitType:",
      line.unitType,
    );

    // Validate received quantity
    if (receivedQty > line.orderedQty) {
      return res
        .status(400)
        .json({ message: "Received quantity exceeds ordered" });
    }

    // Update line
    line.receivedQty = receivedQty;
    if (actualBatchNumber) line.actualBatchNumber = actualBatchNumber;
    if (actualExpiryDate) line.actualExpiryDate = new Date(actualExpiryDate);
    line.verified = true; // FORCE verified to true – if we reach here, it's verified
    if (discrepancyNote) line.discrepancyNote = discrepancyNote;
    await line.save();
    console.log("Order line saved with verified=true");

    // ALWAYS CREATE STOCK BATCH IF receivedQty > 0 (regardless of original verified flag)
    if (receivedQty > 0) {
      console.log("Creating stock batch because receivedQty > 0...");
      const drug = await DrugName.findById(line.drugName);
      const batchNumber =
        actualBatchNumber || line.batchNumber || `BATCH-${Date.now()}`;
      let expiry = actualExpiryDate
        ? new Date(actualExpiryDate)
        : line.expiryDate;

      // If still no expiry, set a default (1 year from now)
      if (!expiry) {
        expiry = new Date();
        expiry.setFullYear(expiry.getFullYear() + 1);
        console.warn("No expiry date provided, using default:", expiry);
      }

      const batchData = {
        orderLine: line._id,
        drugName: line.drugName._id,
        batchNumber: batchNumber,
        expiryDate: expiry,
        costPrice: line.costPrice,
        sellingPrice: line.sellingPrice,
        unitType: line.unitType,
        remainingQty: receivedQty,
        shelfLocation: drug?.shelfLocation || "",
      };

      // Generate QR (optional, don't block)
      try {
        const qrCode = await generateQR({
          batchId: batchNumber,
          drugName: drug?.name,
          expiry,
        });
        if (qrCode) batchData.qrCode = qrCode;
      } catch (qrErr) {
        console.warn("QR generation failed, continuing:", qrErr.message);
      }

      const stockBatch = await StockBatch.create(batchData);
      console.log(
        `✅ STOCK BATCH CREATED: ${stockBatch._id} with ${receivedQty} ${line.unitType}s`,
      );
    } else {
      console.log("No stock batch created because receivedQty = 0");
    }

    // Update order status
    const order = await PurchaseOrder.findById(line.order);
    const allLines = await PurchaseOrderLine.find({ order: order._id });
    const allVerified = allLines.every((l) => l.verified === true);
    const anyReceived = allLines.some((l) => l.receivedQty > 0);

    if (allVerified) {
      order.status = "Completed";
    } else if (anyReceived) {
      order.status = "Partially Received";
    }
    if (!order.receivedDate && anyReceived) {
      order.receivedDate = new Date();
    }
    await order.save();
    console.log("Order status updated to:", order.status);

    res.json({ message: "Line verified and stock updated", line });
  } catch (error) {
    console.error("ERROR in verifyLine:", error);
    res.status(500).json({ message: error.message });
  }
};
