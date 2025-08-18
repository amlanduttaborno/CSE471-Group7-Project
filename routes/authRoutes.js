const express = require('express');
const router = express.Router();
const { 
    register, 
    login, 
    verifyEmail, 
    resendOTP,
    forgotPassword,
    resetPassword
} = require('../controllers/authController');

// All auth routes are public (token handling is done in the controllers)
router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;