const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail, generateOTP } = require('../utils/email');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      if (!user.isVerified) {
        // User exists but not verified, send new verification code
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        user.otp = {
          code: otp,
          expiresAt: otpExpiry
        };
        await user.save();
        await sendVerificationEmail(email, otp);
        
        return res.status(200).json({
          message: 'Account exists but not verified. New verification code sent to your email.',
          token: generateToken(user._id)
        });
      }
      return res.status(400).json({ message: 'An account with this email already exists. Please login instead.' });
    }

    // Generate OTP for new user
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user
    user = new User({
      name,
      email,
      password,
      otp: {
        code: otp,
        expiresAt: otpExpiry
      }
    });

    await user.save();

    // Send verification email
    await sendVerificationEmail(email, otp);

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Registration successful. Please verify your email.',
      token
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { otp } = req.body;
    const user = req.user;

    if (!user.otp || !user.otp.code || user.otp.expiresAt < Date.now()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    if (user.otp.code !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'No account found with this email. Please register first.' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password. Please try again.' });
    }

    // Check if email is verified
    if (!user.isVerified) {
      // Generate new OTP if needed
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      user.otp = {
        code: otp,
        expiresAt: otpExpiry
      };
      await user.save();
      await sendVerificationEmail(email, otp);

      return res.status(401).json({ 
        message: 'Email not verified. A new verification code has been sent to your email.',
        needsVerification: true,
        token: generateToken(user._id)
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        address: user.address,
        phone: user.phone
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, address, phone } = req.body;
    const user = req.user;

    user.name = name || user.name;
    user.address = address || user.address;
    user.phone = phone || user.phone;

    await user.save();

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        address: user.address,
        phone: user.phone
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
