const express = require('express');
const router = express.Router();
const { protectTailor } = require('../middleware/tailorAuth');
const { 
    getTailorStats, 
    getRecentOrders,
    getRecentReviews,
    getEarningsData
} = require('../controllers/tailorDashboardController');

// All routes require tailor authentication
router.use(protectTailor);

// Dashboard stats and data
router.get('/stats', getTailorStats);
router.get('/recent-orders', getRecentOrders);
router.get('/recent-reviews', getRecentReviews);
router.get('/earnings', getEarningsData);

module.exports = router;
