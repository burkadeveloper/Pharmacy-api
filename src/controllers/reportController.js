import Sale from "../models/Sale.js";
import StockBatch from "../models/StockBatch.js";
import PurchaseOrder from "../models/PurchaseOrder.js";
import PurchaseOrderLine from "../models/PurchaseOrderLine.js";
import DailyRevenue from "../models/DailyRevenue.js";

export const getMonthlyReport = async (req, res) => {
  try {
    const { year, month } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    // Sales (from dispensing)
    const sales = await Sale.find({ date: { $gte: startDate, $lte: endDate } });
    const totalRevenueFromSales = sales.reduce(
      (sum, s) => sum + s.sellingPriceUsed * s.quantitySold,
      0,
    );
    const totalCostFromSales = sales.reduce(
      (sum, s) => sum + s.costPriceUsed * s.quantitySold,
      0,
    );
    // Manual revenue entries
    const manualRevenues = await DailyRevenue.find({
      date: { $gte: startDate, $lte: endDate },
    });
    const totalManualRevenue = manualRevenues.reduce(
      (sum, r) => sum + r.amount,
      0,
    );
    // Orders
    const orders = await PurchaseOrder.find({
      orderDate: { $gte: startDate, $lte: endDate },
    });
    const totalOrdered = orders.reduce(
      (sum, o) => sum + o.totalOrderedValue,
      0,
    );
    const orderIds = orders.map((o) => o._id);
    const orderLines = await PurchaseOrderLine.find({
      order: { $in: orderIds },
    });
    const totalReceived = orderLines.reduce(
      (sum, l) => sum + l.receivedQty * l.costPrice,
      0,
    );
    const discrepancyValue = totalOrdered - totalReceived;

    res.json({
      period: `${year}-${month}`,
      totalManualRevenue,
      totalRevenueFromSales,
      totalRevenue: totalManualRevenue + totalRevenueFromSales,
      totalCost: totalCostFromSales,
      grossProfit:
        totalManualRevenue + totalRevenueFromSales - totalCostFromSales,
      totalOrdered,
      totalReceived,
      discrepancyValue,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getExpiryReport = async (req, res) => {
  try {
    const today = new Date();
    const ninetyDaysLater = new Date();
    ninetyDaysLater.setDate(ninetyDaysLater.getDate() + 90);
    const batches = await StockBatch.find({
      expiryDate: { $gte: today, $lte: ninetyDaysLater },
      remainingQty: { $gt: 0 },
    })
      .populate("drugName")
      .sort("expiryDate");
    res.json(batches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getRevenueAnalysis = async (req, res) => {
  try {
    const { year, month } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const revenues = await DailyRevenue.find({
      date: { $gte: startDate, $lte: endDate },
    }).sort("date");

    const dailyData = revenues.map((r) => ({
      date: r.date.toISOString().split("T")[0],
      amount: r.amount,
      notes: r.notes,
    }));

    const totalRevenue = dailyData.reduce((sum, d) => sum + d.amount, 0);
    const avgDaily = dailyData.length ? totalRevenue / dailyData.length : 0;
    const highestDay = dailyData.reduce(
      (max, d) => (d.amount > max.amount ? d : max),
      { amount: 0 },
    );
    const daysWithRevenue = dailyData.length;
    const daysInMonth = new Date(year, month, 0).getDate();
    const submissionRate = (daysWithRevenue / daysInMonth) * 100;

    res.json({
      year,
      month,
      dailyData,
      summary: {
        totalRevenue,
        averageDailyRevenue: avgDaily,
        highestRevenueDay: highestDay,
        daysRecorded: daysWithRevenue,
        submissionRate: parseFloat(submissionRate.toFixed(2)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
