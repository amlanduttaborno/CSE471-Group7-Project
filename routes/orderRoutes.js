const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    createOrder,
    getMeasurements,
    updateMeasurements,
    getOrders,
    getOrderDetails,
    getUserOrdersWithTailors,
    createTestDeliveredOrder
} = require('../controllers/orderController');

// All routes require authentication
router.use(protect);

// Order routes
router.post('/', createOrder); // Changed from '/create' to '/' to match frontend
router.get('/', getOrders);
router.get('/user', getUserOrdersWithTailors); // New route for dashboard
router.get('/:orderId', getOrderDetails);

// Test route for creating delivered orders (for review testing)
router.post('/test/delivered', createTestDeliveredOrder);

// Measurement routes
router.get('/measurements', getMeasurements);
router.put('/measurements', updateMeasurements);

module.exports = router;
