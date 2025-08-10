const Tailor = require('../models/Tailor');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail, generateOTP } = require('../utils/email');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const { validatePassword } = require('../utils/validation');

exports.register = async (req, res) => {
  try {
    const { name, email, password, experience, specialization } = req.body;

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        status: 'error',
        message: passwordValidation.message
      });
    }

    // Check if tailor exists
    let tailor = await Tailor.findOne({ email });
    if (tailor) {
      return res.status(400).json({ message: 'Tailor already exists' });
    }

    // Create tailor
    tailor = new Tailor({
      name,
      email,
      password,
      experience,
      specialization
    });

    await tailor.save();

    res.status(201).json({
      message: 'Registration successful. Please wait for admin approval.'
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if tailor exists
    const tailor = await Tailor.findOne({ email });
    if (!tailor) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await tailor.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if approved
    if (!tailor.isApproved) {
      return res.status(401).json({ message: 'Your account is pending approval' });
    }

    // Generate token
    const token = generateToken(tailor._id);

    res.json({
      token,
      tailor: {
        id: tailor._id,
        name: tailor.name,
        email: tailor.email,
        experience: tailor.experience,
        specialization: tailor.specialization
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Admin only endpoint
exports.approveTailor = async (req, res) => {
  try {
    const { tailorId } = req.params;

    const tailor = await Tailor.findById(tailorId);
    if (!tailor) {
      return res.status(404).json({ message: 'Tailor not found' });
    }

    tailor.isApproved = true;
    await tailor.save();

    res.json({ message: 'Tailor approved successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};