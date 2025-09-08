const express = require('express');
const router = express.Router();
const measurementController = require('../controllers/measurementController');
const { protect } = require('../middleware/auth'); // Use same auth middleware as orders

// Get all saved measurements for user
router.get('/measurements/user', protect, (req, res) => {
    measurementController.getMeasurements(req, res);
});

// Get measurements (legacy endpoint for backward compatibility)
router.get('/measurements', protect, (req, res) => {
    measurementController.getMeasurements(req, res);
});

// Save new measurements
router.post('/measurements', protect, (req, res) => {
    measurementController.saveMeasurements(req, res);
});

// Update specific measurement by ID
router.put('/measurements/:id', protect, (req, res) => {
    measurementController.updateMeasurements(req, res);
});

// Delete specific measurement by ID
router.delete('/measurements/:id', protect, (req, res) => {
    measurementController.deleteMeasurements(req, res);
});

// Get specific measurement by ID
router.get('/measurements/:id', protect, (req, res) => {
    measurementController.getMeasurementById(req, res);
});

module.exports = router;
