import DrugName from "../models/DrugName.js";
import Category from "../models/Category.js";
import StockBatch from "../models/StockBatch.js";
import PurchaseOrderLine from "../models/PurchaseOrderLine.js";

export const getDrugs = async (req, res) => {
  try {
    const drugs = await DrugName.find().populate("category");
    res.json(drugs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createDrug = async (req, res) => {
  try {
    const drug = await DrugName.create(req.body);
    res.status(201).json(drug);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateDrug = async (req, res) => {
  try {
    const drug = await DrugName.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!drug) return res.status(404).json({ message: "Drug not found" });
    res.json(drug);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteDrug = async (req, res) => {
  try {
    await DrugName.findByIdAndDelete(req.params.id);
    res.json({ message: "Drug deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
