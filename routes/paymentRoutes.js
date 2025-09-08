const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// Payment initiation and status
router.post('/initiate', protect, paymentController.initiatePayment);
router.post('/complete', protect, paymentController.completePayment);
router.get('/status/:orderId', protect, paymentController.getPaymentStatus);
router.get('/details/:orderId', protect, paymentController.getOrderPaymentDetails);

// SSLCommerz webhook endpoints
router.post('/success', paymentController.handlePaymentSuccess);
router.post('/fail', paymentController.handlePaymentFailure);
router.post('/cancel', paymentController.handlePaymentFailure);
router.post('/ipn', paymentController.handlePaymentSuccess);

module.exports = router;
