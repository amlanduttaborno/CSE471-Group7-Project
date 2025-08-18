const express = require('express');
const router = express.Router();
const measurementController = require('../controllers/measurementController');
const authMiddleware = require('../middleware/auth');

// Get saved measurements
router.get('/measurements', authMiddleware, (req, res) => {
    measurementController.getMeasurements(req, res);
});

// Save measurements
router.post('/measurements', authMiddleware, (req, res) => {
    measurementController.saveMeasurements(req, res);
});

module.exports = router;
