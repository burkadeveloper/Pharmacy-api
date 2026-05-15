import PurchaseOrder from "../models/PurchaseOrder.js";
import PurchaseOrderLine from "../models/PurchaseOrderLine.js";
import StockBatch from "../models/StockBatch.js";
import Sale from "../models/Sale.js";
import DrugName from "../models/DrugName.js";
import Company from "../models/Company.js";

// ------------------------------------------------------------
// Dashboard KPIs
// ------------------------------------------------------------
export const getDashboardKPIs = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's sales (from dispensations)
    const todaySales = await Sale.aggregate([
      { $match: { date: { $gte: today, $lt: tomorrow } } },
      {
        $group: {
          _id: null,
          revenue: {
            $sum: { $multiply: ["$sellingPriceUsed", "$quantitySold"] },
          },
          profit: {
            $sum: {
              $multiply: [
                { $subtract: ["$sellingPriceUsed", "$costPriceUsed"] },
                "$quantitySold",
              ],
            },
          },
        },
      },
    ]);

    // Month sales
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthSales = await Sale.aggregate([
      { $match: { date: { $gte: startOfMonth } } },
      {
        $group: {
          _id: null,
          revenue: {
            $sum: { $multiply: ["$sellingPriceUsed", "$quantitySold"] },
          },
          profit: {
            $sum: {
              $multiply: [
                { $subtract: ["$sellingPriceUsed", "$costPriceUsed"] },
                "$quantitySold",
              ],
            },
          },
        },
      },
    ]);

    // Total stock value (cost)
    const batches = await StockBatch.find();
    const totalStockValue = batches.reduce(
      (sum, b) => sum + b.remainingQty * b.costPrice,
      0,
    );

    // Expiring soon (<30 days)
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    const expiringSoon = await StockBatch.find({
      expiryDate: { $lte: thirtyDaysLater, $gte: new Date() },
      remainingQty: { $gt: 0 },
    });
    const expiringSoonCount = expiringSoon.length;
    const expiringSoonValue = expiringSoon.reduce(
      (sum, b) => sum + b.remainingQty * b.costPrice,
      0,
    );

    // Pending orders
    const pendingOrders = await PurchaseOrder.countDocuments({
      status: { $in: ["Pending", "Updated", "Partially Received"] },
    });

    res.json({
      todayRevenue: todaySales[0]?.revenue || 0,
      todayProfit: todaySales[0]?.profit || 0,
      monthRevenue: monthSales[0]?.revenue || 0,
      monthProfit: monthSales[0]?.profit || 0,
      totalStockValue,
      expiringSoonCount,
      expiringSoonValue,
      pendingOrders,
    });
  } catch (error) {
    console.error("getDashboardKPIs error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ------------------------------------------------------------
// Revenue chart (last 30 days)
// ------------------------------------------------------------
export const getRevenueChart = async (req, res) => {
  try {
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const next = new Date(date);
      next.setDate(next.getDate() + 1);
      const sales = await Sale.aggregate([
        { $match: { date: { $gte: date, $lt: next } } },
        {
          $group: {
            _id: null,
            revenue: {
              $sum: { $multiply: ["$sellingPriceUsed", "$quantitySold"] },
            },
          },
        },
      ]);
      last30Days.push({
        date: date.toISOString().split("T")[0],
        revenue: sales[0]?.revenue || 0,
      });
    }
    res.json(last30Days);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ------------------------------------------------------------
// Top 10 drugs by quantity sold
// ------------------------------------------------------------
export const getTopDrugs = async (req, res) => {
  try {
    const topByQuantity = await Sale.aggregate([
      {
        $lookup: {
          from: "stockbatches",
          localField: "stockBatch",
          foreignField: "_id",
          as: "batch",
        },
      },
      { $unwind: "$batch" },
      {
        $group: {
          _id: "$batch.drugName",
          totalQty: { $sum: "$quantitySold" },
          totalRevenue: {
            $sum: { $multiply: ["$sellingPriceUsed", "$quantitySold"] },
          },
        },
      },
      { $sort: { totalQty: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "drugnames",
          localField: "_id",
          foreignField: "_id",
          as: "drug",
        },
      },
      { $unwind: "$drug" },
    ]);
    res.json(topByQuantity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ------------------------------------------------------------
// Bottom 5 slowest drugs (includes drugs with zero sales)
// ------------------------------------------------------------
export const getSlowestDrugs = async (req, res) => {
  try {
    const allDrugs = await DrugName.find();
    const salesAgg = await Sale.aggregate([
      {
        $lookup: {
          from: "stockbatches",
          localField: "stockBatch",
          foreignField: "_id",
          as: "batch",
        },
      },
      { $unwind: "$batch" },
      {
        $group: {
          _id: "$batch.drugName",
          totalSold: { $sum: "$quantitySold" },
        },
      },
    ]);
    const salesMap = new Map(
      salesAgg.map((s) => [s._id.toString(), s.totalSold]),
    );
    const drugSales = allDrugs.map((drug) => ({
      drug: { name: drug.name, brand: drug.brand, _id: drug._id },
      totalSold: salesMap.get(drug._id.toString()) || 0,
    }));
    const slowest = drugSales
      .sort((a, b) => a.totalSold - b.totalSold)
      .slice(0, 5);
    res.json(slowest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ------------------------------------------------------------
// Expiry forecast (bar chart)
// ------------------------------------------------------------
export const getExpiryForecast = async (req, res) => {
  try {
    const today = new Date();
    const intervals = [
      { label: "0-30 days", start: 0, end: 30 },
      { label: "31-60 days", start: 31, end: 60 },
      { label: "61-90 days", start: 61, end: 90 },
      { label: "91-180 days", start: 91, end: 180 },
      { label: ">180 days", start: 181, end: Infinity },
    ];
    const forecast = [];
    for (const interval of intervals) {
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() + interval.start);
      let endDate = null;
      if (interval.end !== Infinity) {
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + interval.end);
      }
      const match = { expiryDate: { $gte: startDate } };
      if (endDate) match.expiryDate.$lte = endDate;
      const batches = await StockBatch.find(match);
      const totalQty = batches.reduce((sum, b) => sum + b.remainingQty, 0);
      forecast.push({ range: interval.label, quantity: totalQty });
    }
    res.json(forecast);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ------------------------------------------------------------
// Order status funnel (pie chart)
// ------------------------------------------------------------
export const getOrderStatusFunnel = async (req, res) => {
  try {
    const funnel = await PurchaseOrder.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    res.json(funnel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ------------------------------------------------------------
// Monthly ordered vs received value (line chart)
// ------------------------------------------------------------
export const getMonthlyOrderVsReceipt = async (req, res) => {
  try {
    const orders = await PurchaseOrder.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$orderDate" },
            month: { $month: "$orderDate" },
          },
          totalOrdered: { $sum: "$totalOrderedValue" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);
    const lines = await PurchaseOrderLine.aggregate([
      {
        $lookup: {
          from: "purchaseorders",
          localField: "order",
          foreignField: "_id",
          as: "order",
        },
      },
      { $unwind: "$order" },
      {
        $group: {
          _id: {
            year: { $year: "$order.orderDate" },
            month: { $month: "$order.orderDate" },
          },
          totalReceived: {
            $sum: { $multiply: ["$receivedQty", "$costPrice"] },
          },
        },
      },
    ]);
    const combined = orders.map((o) => {
      const rec = lines.find(
        (l) => l._id.year === o._id.year && l._id.month === o._id.month,
      );
      return {
        month: `${o._id.year}-${String(o._id.month).padStart(2, "0")}`,
        ordered: o.totalOrdered,
        received: rec?.totalReceived || 0,
      };
    });
    res.json(combined);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ------------------------------------------------------------
// Supplier performance metrics (for table)
// ------------------------------------------------------------
export const getSupplierMetrics = async (req, res) => {
  try {
    const companies = await Company.find();
    const metrics = await Promise.all(
      companies.map(async (company) => {
        const orders = await PurchaseOrder.find({ company: company._id });
        const orderIds = orders.map((o) => o._id);
        const lines = await PurchaseOrderLine.find({
          order: { $in: orderIds },
        });

        const totalOrdered = lines.reduce((sum, l) => sum + l.orderedQty, 0);
        const totalReceived = lines.reduce(
          (sum, l) => sum + (l.receivedQty || 0),
          0,
        );
        const fulfilmentRate =
          totalOrdered === 0 ? 0 : (totalReceived / totalOrdered) * 100;

        const onTimeOrders = orders.filter(
          (o) =>
            o.expectedDeliveryDate &&
            o.receivedDate &&
            o.receivedDate <= o.expectedDeliveryDate,
        ).length;
        const onTimeRate =
          orders.length === 0 ? 0 : (onTimeOrders / orders.length) * 100;

        const linesWithDiscrepancy = lines.filter(
          (l) => l.discrepancyNote && l.discrepancyNote.trim() !== "",
        ).length;
        const discrepancyRate =
          lines.length === 0 ? 0 : (linesWithDiscrepancy / lines.length) * 100;

        const leadTimes = orders
          .filter((o) => o.orderDate && o.receivedDate)
          .map(
            (o) =>
              (new Date(o.receivedDate) - new Date(o.orderDate)) /
              (1000 * 60 * 60 * 24),
          );
        const avgLeadTime = leadTimes.length
          ? leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length
          : 0;

        return {
          id: company._id,
          name: company.name,
          fulfilmentRate: parseFloat(fulfilmentRate.toFixed(2)),
          onTimeRate: parseFloat(onTimeRate.toFixed(2)),
          discrepancyRate: parseFloat(discrepancyRate.toFixed(2)),
          avgLeadTime: parseFloat(avgLeadTime.toFixed(1)),
        };
      }),
    );
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ------------------------------------------------------------
// Compare suppliers for a specific drug
// ------------------------------------------------------------
export const compareSuppliersForDrug = async (req, res) => {
  try {
    const { drugId } = req.params;
    // Get all order lines for this drug, populate order and company
    const lines = await PurchaseOrderLine.find({ drugName: drugId }).populate({
      path: "order",
      populate: { path: "company" },
    });

    const supplierMap = new Map();
    for (const line of lines) {
      const company = line.order?.company;
      if (!company) continue;
      const key = company._id.toString();
      if (!supplierMap.has(key)) {
        supplierMap.set(key, {
          companyId: company._id,
          companyName: company.name,
          totalOrderedQty: 0,
          totalReceivedQty: 0,
          totalCostValue: 0,
          totalSellingValue: 0,
          latestExpiry: null,
          totalLines: 0,
          discrepancyCount: 0,
        });
      }
      const entry = supplierMap.get(key);
      entry.totalOrderedQty += line.orderedQty;
      entry.totalReceivedQty += line.receivedQty || 0;
      entry.totalCostValue +=
        line.costPrice * (line.receivedQty || line.orderedQty);
      entry.totalSellingValue +=
        line.sellingPrice * (line.receivedQty || line.orderedQty);
      if (
        line.expiryDate &&
        (!entry.latestExpiry || line.expiryDate > entry.latestExpiry)
      ) {
        entry.latestExpiry = line.expiryDate;
      }
      entry.totalLines++;
      if (line.discrepancyNote) entry.discrepancyCount++;
    }

    const result = Array.from(supplierMap.values()).map((s) => ({
      company: s.companyName,
      avgCost:
        s.totalOrderedQty === 0 ? 0 : s.totalCostValue / s.totalOrderedQty,
      avgSelling:
        s.totalOrderedQty === 0 ? 0 : s.totalSellingValue / s.totalOrderedQty,
      latestExpiry: s.latestExpiry,
      fulfilmentRate:
        s.totalOrderedQty === 0
          ? 0
          : (s.totalReceivedQty / s.totalOrderedQty) * 100,
      discrepancyRate:
        s.totalLines === 0 ? 0 : (s.discrepancyCount / s.totalLines) * 100,
      totalOrdered: s.totalOrderedQty,
      totalReceived: s.totalReceivedQty,
    }));
    res.json(result);
  } catch (error) {
    console.error("compareSuppliersForDrug error:", error);
    res.status(500).json({ message: error.message });
  }
};
