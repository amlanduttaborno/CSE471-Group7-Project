const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getDashboardData, getDashboardSummary } = require('../controllers/dashboardController');

// All dashboard routes require authentication
router.use(protect);

// Dashboard main data
router.get('/', getDashboardData);
router.get('/summary', getDashboardSummary);

module.exports = router;
