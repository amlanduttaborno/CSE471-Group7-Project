const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
    getTailorProfile, 
    updateTailorProfile, 
    updateTailorProfileImage 
} = require('../controllers/tailorProfileController');

// Protect all tailor profile routes
router.use(protect);

// Tailor profile routes
router.route('/')
    .get(getTailorProfile)
    .put(updateTailorProfile);

// Tailor profile image upload route
router.post('/image', updateTailorProfileImage);

module.exports = router;
