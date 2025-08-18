const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    createOrder,
    getMeasurements,
    updateMeasurements,
    getOrders,
    getOrderDetails
} = require('../controllers/orderController');

// All routes require authentication
router.use(protect);

// Order routes
router.post('/create', createOrder);
router.get('/', getOrders);
router.get('/:orderId', getOrderDetails);

// Measurement routes
router.get('/measurements', getMeasurements);
router.put('/measurements', updateMeasurements);

module.exports = router;
