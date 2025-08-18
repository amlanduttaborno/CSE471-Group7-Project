const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  register,
  login,
  verifyEmail,
  updateProfile
} = require('../controllers/userController');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.post('/verify-email', protect, verifyEmail);
router.put('/profile', protect, updateProfile);

module.exports = router;