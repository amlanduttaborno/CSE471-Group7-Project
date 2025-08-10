const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getProfile, updateProfile } = require('../controllers/profileController');

// Protect all profile routes
router.use(protect);

// Profile routes
router.route('/')
    .get(getProfile)
    .put(updateProfile);

module.exports = router;