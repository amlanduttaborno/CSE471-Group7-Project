const User = require('../models/User');
const Tailor = require('../models/Tailor');
const Order = require('../models/Order');
const Admin = require('../models/Admin');

// 1. Approve new users and tailors (with pagination)
exports.getPendingUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find({ approved: false }).skip(skip).limit(limit),
      User.countDocuments({ approved: false })
    ]);
    res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPendingTailors = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const [tailors, total] = await Promise.all([
      Tailor.find({ approved: false }).skip(skip).limit(limit),
      Tailor.countDocuments({ approved: false })
    ]);
    res.json({ tailors, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.approveUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { approved: true }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    // TODO: Send email notification if needed
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.approveTailor = async (req, res) => {
  try {
    const tailor = await Tailor.findByIdAndUpdate(req.params.id, { approved: true }, { new: true });
    if (!tailor) return res.status(404).json({ error: 'Tailor not found' });
    // TODO: Send email notification if needed
    res.json({ success: true, tailor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Monitor ongoing orders, delivery status, customer status (with pagination)
exports.getOngoingOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    // Fetch orders as before
    const [orders, total] = await Promise.all([
      Order.find({ status: { $in: ['pending', 'in-progress', 'Pending', 'In Progress'] } })
        .populate({
          path: 'tailor',
          match: { _id: { $ne: null } } // Only populate if tailor is not null
        })
        .populate('user')
        .skip(skip).limit(limit),
      Order.countDocuments({ status: { $in: ['pending', 'in-progress', 'Pending', 'In Progress'] } })
    ]);
    res.json({ orders, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Manually assign tailor to order
exports.assignTailor = async (req, res) => {
  try {
    const { orderId, tailorId } = req.body;
    const order = await Order.findByIdAndUpdate(orderId, { tailor: tailorId, status: 'in-progress' }, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. Reports: orders per day/week, top customers, top tailors
exports.getOrderStats = async (req, res) => {
  try {
    const { period } = req.query; // 'day' or 'week'
    let groupBy;
    if (period === 'week') {
      groupBy = { $week: '$createdAt' };
    } else {
      groupBy = { $dayOfYear: '$createdAt' };
    }
    const stats = await Order.aggregate([
      { $group: { _id: groupBy, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTopCustomers = async (req, res) => {
  try {
    const top = await Order.aggregate([
      { $group: { _id: '$customer', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    res.json(top);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTopTailors = async (req, res) => {
  try {
    const top = await Order.aggregate([
      { $group: { _id: '$tailor', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    res.json(top);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin registration and login
exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let admin = await Admin.findOne({ email });
    if (admin) {
      return res.status(400).json({ message: 'Admin with this email already exists.' });
    }
    admin = new Admin({ name, email, password });
    await admin.save();
    res.status(201).json({ message: 'Admin registered successfully.', admin });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: 'No admin found with this email.' });
    }
    // For demo: compare plain text (replace with bcrypt in production)
    if (admin.password !== password) {
      return res.status(401).json({ message: 'Incorrect password.' });
    }
    res.json({ message: 'Login successful', admin });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};