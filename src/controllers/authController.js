import User from "../models/User.js";
import jwt from "jsonwebtoken";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });
    const user = await User.create({ name, email, password });
    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      token: generateToken(user.id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    // Check if user has a password field
    if (!user.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
export const getRevenueByDate = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const revenue = await DailyRevenue.findOne({ date: targetDate });
    res.json(revenue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAdminProfile = async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists)
        return res.status(400).json({ message: "Email already in use" });
      user.email = email;
    }
    if (name) user.name = name;
    if (newPassword) {
      if (!currentPassword)
        return res.status(400).json({ message: "Current password required" });
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch)
        return res.status(401).json({ message: "Current password incorrect" });
      user.password = newPassword;
    }
    await user.save();
    res.json({
      message: "Profile updated",
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const setupFirstAdmin = async (req, res) => {
  try {
    const { name, email, password, secretKey } = req.body;
    
    // Check if any admin exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      return res.status(403).json({ message: 'Admin already exists. Use update endpoint.' });
    }
    
    // Verify a master secret key (store in environment variable)
    if (secretKey !== process.env.MASTER_SECRET) {
      return res.status(401).json({ message: 'Invalid secret key' });
    }
    
    const admin = await User.create({ name, email, password, role: 'admin' });
    res.status(201).json({ message: 'Admin created', admin: { id: admin._id, name, email } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }  
};
