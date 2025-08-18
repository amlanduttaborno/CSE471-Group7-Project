const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Tailor = require('../models/Tailor');

exports.protect = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

exports.protectTailor = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if tailor still exists and is approved
    const tailor = await Tailor.findById(decoded.id);
    if (!tailor || !tailor.isApproved) {
      return res.status(401).json({ message: 'Token is not valid or account not approved' });
    }

    req.tailor = tailor;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
