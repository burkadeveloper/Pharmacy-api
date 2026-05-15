import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import Company from "./models/Company.js";
import Category from "./models/Category.js";
import DrugName from "./models/DrugName.js";
import PurchaseOrder from "./models/PurchaseOrder.js";
import PurchaseOrderLine from "./models/PurchaseOrderLine.js";
import StockBatch from "./models/StockBatch.js";
import Sale from "./models/Sale.js";
import { generateQR } from "./utils/qrGenerator.js";

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    await mongoose.connection.dropDatabase();

    // Create admin
    const admin = await User.create({
      name: "Admin User",
      email: "admin@pharmacy.com",
      password: "admin123",
    });

    // Create companies
    const pharma1 = await Company.create({
      name: "PharmaSource Ltd",
      contact: "contact@pharmasource.com",
      taxId: "TAX123",
    });
    const pharma2 = await Company.create({
      name: "MediSupplies",
      contact: "info@medisupplies.com",
      taxId: "TAX456",
    });

    // Create category
    const antibiotics = await Category.create({ name: "Antibiotics" });
    const painkillers = await Category.create({ name: "Painkillers" });

    // Create drugs
    const amox = await DrugName.create({
      name: "Amoxicillin 500mg",
      category: antibiotics._id,
      shelfLocation: "A1",
      minStockThreshold: 100,
    });
    const ibu = await DrugName.create({
      name: "Ibuprofen 200mg",
      category: painkillers._id,
      shelfLocation: "B2",
      minStockThreshold: 200,
    });
    const para = await DrugName.create({
      name: "Paracetamol 500mg",
      category: painkillers._id,
      shelfLocation: "B3",
      minStockThreshold: 150,
    });

    // Create a completed order
    const order1 = await PurchaseOrder.create({
      orderNumber: "PO-2026-0001",
      company: pharma1._id,
      orderDate: new Date("2026-04-01"),
      expectedDeliveryDate: new Date("2026-04-10"),
      status: "Completed",
      totalOrderedValue: 5000,
      receivedDate: new Date("2026-04-08"),
    });

    const line1 = await PurchaseOrderLine.create({
      order: order1._id,
      drugName: amox._id,
      orderedQty: 1000,
      unitType: "Tablet",
      unitSize: "500mg",
      batchNumber: "AMX-123",
      expiryDate: new Date("2027-01-01"),
      costPrice: 2.5,
      sellingPrice: 5.0,
      receivedQty: 1000,
      verified: true,
      actualBatchNumber: "AMX-123",
      actualExpiryDate: new Date("2027-01-01"),
    });

    const qr1 = await generateQR({
      batchId: "AMX-123",
      drugName: "Amoxicillin 500mg",
    });
    await StockBatch.create({
      orderLine: line1._id,
      drugName: amox._id,
      batchNumber: "AMX-123",
      expiryDate: new Date("2027-01-01"),
      costPrice: 2.5,
      sellingPrice: 5.0,
      unitType: "Tablet",
      remainingQty: 850,
      qrCode: qr1,
      shelfLocation: "A1",
    });

    const line2 = await PurchaseOrderLine.create({
      order: order1._id,
      drugName: ibu._id,
      orderedQty: 500,
      unitType: "Tablet",
      unitSize: "200mg",
      batchNumber: "IBU-456",
      expiryDate: new Date("2026-12-01"),
      costPrice: 1.8,
      sellingPrice: 4.0,
      receivedQty: 500,
      verified: true,
      actualBatchNumber: "IBU-456",
      actualExpiryDate: new Date("2026-12-01"),
    });

    const qr2 = await generateQR({
      batchId: "IBU-456",
      drugName: "Ibuprofen 200mg",
    });
    await StockBatch.create({
      orderLine: line2._id,
      drugName: ibu._id,
      batchNumber: "IBU-456",
      expiryDate: new Date("2026-12-01"),
      costPrice: 1.8,
      sellingPrice: 4.0,
      unitType: "Tablet",
      remainingQty: 400,
      qrCode: qr2,
      shelfLocation: "B2",
    });

    // Create a pending order
    const order2 = await PurchaseOrder.create({
      orderNumber: "PO-2026-0002",
      company: pharma2._id,
      orderDate: new Date("2026-05-10"),
      expectedDeliveryDate: new Date("2026-05-20"),
      status: "Pending",
      totalOrderedValue: 3200,
    });

    await PurchaseOrderLine.create({
      order: order2._id,
      drugName: para._id,
      orderedQty: 800,
      unitType: "Tablet",
      unitSize: "500mg",
      batchNumber: "PAR-789",
      expiryDate: new Date("2027-03-01"),
      costPrice: 1.2,
      sellingPrice: 3.5,
      receivedQty: 0,
      verified: false,
    });

    // Create some sales
    const batchAmox = await StockBatch.findOne({ batchNumber: "AMX-123" });
    await Sale.create({
      stockBatch: batchAmox._id,
      quantitySold: 100,
      sellingPriceUsed: 5.0,
      costPriceUsed: 2.5,
      date: new Date("2026-05-01"),
    });
    await Sale.create({
      stockBatch: batchAmox._id,
      quantitySold: 50,
      sellingPriceUsed: 5.0,
      costPriceUsed: 2.5,
      date: new Date("2026-05-05"),
    });
    const batchIbu = await StockBatch.findOne({ batchNumber: "IBU-456" });
    await Sale.create({
      stockBatch: batchIbu._id,
      quantitySold: 100,
      sellingPriceUsed: 4.0,
      costPriceUsed: 1.8,
      date: new Date("2026-05-02"),
    });

    console.log("Database seeded successfully!");
    process.exit();
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
};

seed();
