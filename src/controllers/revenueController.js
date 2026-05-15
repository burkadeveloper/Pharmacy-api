import DailyRevenue from "../models/DailyRevenue.js";

// Get revenue for today and month
export const getRevenueSummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayRevenue = await DailyRevenue.findOne({
      date: { $gte: today, $lt: tomorrow },
    });
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthRevenues = await DailyRevenue.find({
      date: { $gte: startOfMonth, $lt: tomorrow },
    });
    const monthTotal = monthRevenues.reduce((sum, r) => sum + r.amount, 0);

    res.json({
      todayRevenue: todayRevenue?.amount || 0,
      monthRevenue: monthTotal,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Submit or update daily revenue
export const submitDailyRevenue = async (req, res) => {
  try {
    const { date, amount, notes } = req.body;
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const existing = await DailyRevenue.findOne({ date: targetDate });
    if (existing) {
      existing.amount = amount;
      existing.notes = notes || "";
      await existing.save();
    } else {
      await DailyRevenue.create({ date: targetDate, amount, notes });
    }
    res.json({ message: "Revenue saved" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getRevenueByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const revenue = await DailyRevenue.findOne({ date: targetDate });
    res.json(revenue || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
