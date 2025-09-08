const express = require('express');
const router = express.Router();
const { getUserActivities, createUserActivity } = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');

// Get user activities (requires authentication)
router.get('/user', protect, getUserActivities);

// Create activity (admin/system use - requires authentication)
router.post('/create', protect, createUserActivity);

module.exports = router;
