const Tailor = require('../models/Tailor');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail, generateOTP } = require('../utils/email');
const crypto = require('crypto');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, experience, specialization } = req.body;

    // Validate required fields
    if (!name || !email || !password || !experience || !specialization) {
      return res.status(400).json({
        status: 'error',
        message: 'All fields are required'
      });
    }

    // Check if tailor exists
    let tailor = await Tailor.findOne({ email });
    if (tailor) {
      return res.status(400).json({
        status: 'error',
        message: 'A tailor with this email already exists'
      });
    }

    // Ensure specialization is an array
    const specializationArray = Array.isArray(specialization) 
      ? specialization 
      : specialization.split(',').map(s => s.trim());

    // Create tailor with OTP
    const otp = generateOTP();
    tailor = new Tailor({
      name,
      email,
      password,
      experience: parseInt(experience),
      specialization: specializationArray,
      isApproved: true, // Always approved for now (will be handled by admin panel later)
      isVerified: false, // All new tailors start as unverified
      otp: otp,
      otpExpires: new Date(Date.now() + 10 * 60 * 1000) // OTP valid for 10 minutes
    });

    await tailor.save();

    // Send verification email
    await sendVerificationEmail(email, otp);

    res.status(201).json({
      status: 'success',
      message: 'Registration successful! Please check your email for verification code.'
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

    // Generate token
    const token = generateToken(tailor._id);

    res.json({
      status: 'success',
      message: 'Login successful',
      token,
      data: {
        tailor: {
          id: tailor._id,
          name: tailor.name,
          email: tailor.email,
          experience: tailor.experience,
          specialization: tailor.specialization,
          isApproved: tailor.isApproved
        }
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find tailor by email
    const tailor = await Tailor.findOne({ email });
    if (!tailor) {
      return res.status(404).json({
        status: 'error',
        message: 'Invalid email'
      });
    }

    // Check if OTP exists and is valid
    if (!tailor.otp || !tailor.otpExpires || tailor.otpExpires < Date.now()) {
      return res.status(400).json({
        status: 'error',
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Verify OTP
    if (tailor.otp !== otp) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid OTP'
      });
    }

    // Update tailor status
    tailor.isEmailVerified = true;
    tailor.otp = undefined;
    tailor.otpExpires = undefined;
    await tailor.save();

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully! You can now login to your account.'
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      error: err.message
    });
  }
};

exports.getTailorProfile = async (req, res) => {
  try {
    const tailor = await Tailor.findById(req.tailor._id).select('-password -otp -otpExpires');
    
    res.status(200).json({
      status: 'success',
      data: {
        tailor
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Error fetching tailor profile',
      error: err.message
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const {
      name,
      phoneNumber,
      shopName,
      experience,
      specialization,
      shopAddress,
      businessHours,
      bio
    } = req.body;

    const updateData = {
      name,
      phoneNumber,
      shopName,
      experience,
      specialization,
      shopAddress,
      businessHours,
      bio
    };

    const tailor = await Tailor.findByIdAndUpdate(
      req.tailor._id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).select('-password -otp -otpExpires');

    res.status(200).json({
      status: 'success',
      data: {
        tailor
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Error updating tailor profile',
      error: err.message
    });
  }
};

exports.updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Please upload an image file'
      });
    }

    const profilePicturePath = '/uploads/profiles/' + req.file.filename;
    
    const tailor = await Tailor.findByIdAndUpdate(
      req.tailor._id,
      { profilePicture: profilePicturePath },
      {
        new: true,
        runValidators: true
      }
    ).select('-password -otp -otpExpires');

    res.status(200).json({
      status: 'success',
      data: {
        profilePicture: profilePicturePath,
        tailor: tailor
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Error updating profile picture',
      error: err.message
    });
  }
};

// Get all approved tailors for customers to select
exports.getAllApprovedTailors = async (req, res) => {
  try {
    console.log('🔍 getAllApprovedTailors called');
    
    // Get all registered tailors (we can add approval logic later)
    const tailors = await Tailor.find({})
      .select('name email experience specialization shopName shopAddress businessHours bio profilePicture phoneNumber isApproved')
      .sort({ createdAt: -1 }); // Show newest tailors first

    console.log(`📊 Found ${tailors.length} tailors in database`);
    
    if (tailors.length > 0) {
      console.log('👥 Sample tailor:', tailors[0].name);
    }

    // Transform the data to match frontend expectations
    const transformedTailors = tailors.map(tailor => ({
      _id: tailor._id,
      name: tailor.name,
      email: tailor.email,
      experience: tailor.experience,
      specializations: tailor.specialization, // Map specialization to specializations
      shopName: tailor.shopName,
      shopAddress: tailor.shopAddress,
      businessHours: tailor.businessHours,
      bio: tailor.bio || '',
      profilePicture: tailor.profilePicture || 'https://via.placeholder.com/150',
      phoneNumber: tailor.phoneNumber,
      isApproved: tailor.isApproved,
      location: tailor.shopAddress ? 
        [tailor.shopAddress.city, tailor.shopAddress.state].filter(Boolean).join(', ') || 'Not specified' : 
        'Not specified',
      averageRating: Math.floor(Math.random() * 2) + 4, // Random rating between 4-5 for demo
      totalReviews: Math.floor(Math.random() * 50) + 5 // Random review count for demo
    }));

    console.log(`✅ Returning ${transformedTailors.length} transformed tailors`);

    res.status(200).json({
      status: 'success',
      data: {
        tailors: transformedTailors
      }
    });
  } catch (err) {
    console.error('Error fetching tailors:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching tailors',
      error: err.message
    });
  }
};
