const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/auth');

// Payment initiation and status
router.post('/initiate', authMiddleware, paymentController.initiatePayment);
router.get('/status/:orderId', authMiddleware, paymentController.getPaymentStatus);

// SSLCommerz webhook endpoints
router.post('/success', paymentController.handlePaymentSuccess);
router.post('/fail', paymentController.handlePaymentFailure);
router.post('/cancel', paymentController.handlePaymentFailure);
router.post('/ipn', paymentController.handlePaymentSuccess);

module.exports = router;
