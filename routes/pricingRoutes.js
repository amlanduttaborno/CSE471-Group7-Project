const express = require('express');
const router = express.Router();
const pricingController = require('../controllers/pricingController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/calculate', pricingController.calculatePrice);
router.get('/config/:fabricProvider/:garmentType', pricingController.getPricingConfig);
router.get('/fabric-options/:fabricProvider/:garmentType', pricingController.getFabricOptions);

// Protected routes (require authentication)
router.get('/configs', protect, pricingController.getAllPricingConfigs);

// Admin routes (might need additional admin middleware)
router.post('/configs', protect, pricingController.createPricingConfig);
router.put('/configs/:id', protect, pricingController.updatePricingConfig);
router.delete('/configs/:id', protect, pricingController.deletePricingConfig);

module.exports = router;
