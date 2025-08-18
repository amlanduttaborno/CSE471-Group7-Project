const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getDashboardData, getDashboardSummary } = require('../controllers/dashboardController');
const { getMeasurements, saveMeasurements } = require('../controllers/measurementController');

// All dashboard routes require authentication
router.use(protect);

// Dashboard main data
router.get('/', getDashboardData);
router.get('/summary', getDashboardSummary);

// Measurements routes
router.get('/measurements', getMeasurements);
router.post('/measurements', saveMeasurements);

module.exports = router;
