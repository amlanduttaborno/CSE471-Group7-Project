const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
    getProfile, 
    updateProfile, 
    updateProfileImage 
} = require('../controllers/profileController');

// Protect all profile routes
router.use(protect);

// Profile routes
router.route('/')
    .get(getProfile)
    .put(updateProfile);

// Profile image upload route
router.post('/image', updateProfileImage);

module.exports = router;