import Company from "../models/Company.js";
import PurchaseOrder from "../models/PurchaseOrder.js";
import PurchaseOrderLine from "../models/PurchaseOrderLine.js";

export const getCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort("name");
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createCompany = async (req, res) => {
  try {
    const company = await Company.create(req.body);
    res.status(201).json(company);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!company) return res.status(404).json({ message: "Company not found" });
    res.json(company);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) return res.status(404).json({ message: "Company not found" });
    res.json({ message: "Company deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Supplier metrics
export const getSupplierMetrics = async (req, res) => {
  try {
    const companies = await Company.find();
    const metrics = await Promise.all(
      companies.map(async (company) => {
        const orders = await PurchaseOrder.find({ company: company._id });
        const orderLines = await PurchaseOrderLine.find({
          order: { $in: orders.map((o) => o._id) },
        });

        const totalOrdered = orderLines.reduce(
          (sum, l) => sum + l.orderedQty,
          0,
        );
        const totalReceived = orderLines.reduce(
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

        const linesWithDiscrepancy = orderLines.filter(
          (l) => l.discrepancyNote && l.discrepancyNote.trim() !== "",
        ).length;
        const discrepancyRate =
          orderLines.length === 0
            ? 0
            : (linesWithDiscrepancy / orderLines.length) * 100;

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
