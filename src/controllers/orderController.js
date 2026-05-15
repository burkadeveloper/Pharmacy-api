import PurchaseOrder from "../models/PurchaseOrder.js";
import PurchaseOrderLine from "../models/PurchaseOrderLine.js";
import DrugName from "../models/DrugName.js";
import Company from "../models/Company.js";

export const getOrders = async (req, res) => {
  try {
    const orders = await PurchaseOrder.find()
      .populate("company")
      .sort("-createdAt");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id).populate(
      "company",
    );
    if (!order) return res.status(404).json({ message: "Order not found" });
    const lines = await PurchaseOrderLine.find({ order: order._id }).populate(
      "drugName",
    );
    res.json({ order, lines });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createOrder = async (req, res) => {
  try {
    const { company, orderDate, expectedDeliveryDate, notes, lines } = req.body;
    // Calculate total ordered value
    let totalOrderedValue = 0;
    for (const line of lines) {
      totalOrderedValue += line.orderedQty * line.costPrice;
    }
    const order = await PurchaseOrder.create({
      company,
      orderDate,
      expectedDeliveryDate,
      notes,
      totalOrderedValue,
      status: "Pending",
    });
    // Create order lines
    for (const line of lines) {
      await PurchaseOrderLine.create({
        order: order._id,
        drugName: line.drugName,
        orderedQty: line.orderedQty,
        unitType: line.unitType,
        unitSize: line.unitSize,
        batchNumber: line.batchNumber,
        expiryDate: line.expiryDate,
        costPrice: line.costPrice,
        sellingPrice: line.sellingPrice,
        receivedQty: 0,
        verified: false,
      });
    }
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status === "Cancelled") {
      return res.status(400).json({ message: "Cannot update cancelled order" });
    }
    // Update order fields
    Object.assign(order, req.body);
    if (order.status === "Pending" && req.body.status === "Updated") {
      order.status = "Updated";
    }
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status === "Completed") {
      return res.status(400).json({ message: "Cannot cancel completed order" });
    }
    order.status = "Cancelled";
    await order.save();
    res.json({ message: "Order cancelled" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOrderStatusFunnel = async (req, res) => {
  try {
    const counts = await PurchaseOrder.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    res.json(counts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getOrderLinesByDrug = async (req, res) => {
  try {
    const lines = await PurchaseOrderLine.find({
      drugName: req.params.drugId,
    }).populate({ path: "order", populate: { path: "company" } });
    res.json(lines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
