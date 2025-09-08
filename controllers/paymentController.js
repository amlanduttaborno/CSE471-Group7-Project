const Payment = require('../models/Payment');
const Order = require('../models/Order');
const User = require('../models/User');
const Tailor = require('../models/Tailor');
const SSLCommerzPayment = require('sslcommerz-nodejs');

// Initialize SSLCommerz
const sslcommerz = new SSLCommerzPayment(
    process.env.SSLCOMMERZ_STORE_ID,
    process.env.SSLCOMMERZ_STORE_PASSWORD,
    false // Set to true for production
);

exports.initiatePayment = async (req, res) => {
    try {
        const { orderId, paymentType } = req.body;

        // Get order with populated user and tailor details
        const order = await Order.findById(orderId)
            .populate('user', 'name email phone address')
            .populate('tailor', 'name phone');

        if (!order) {
            return res.status(404).json({
                status: 'error',
                message: 'Order not found'
            });
        }

        // Calculate payment amount (40% for advance, 100% for full payment)
        const totalAmount = order.totalAmount;
        const paymentAmount = paymentType === 'advance' ? totalAmount * 0.4 : totalAmount;

        // Simulate payment success for demo/testing
        res.json({
            status: 'success',
            data: {
                paymentId: 'demo-payment-id',
                gatewayUrl: '/payment-success.html',
                amount: paymentAmount,
                orderDetails: {
                    orderId: order._id,
                    tailorName: order.tailor.name,
                    tailorPhone: order.tailor.phone,
                    totalAmount: order.totalAmount,
                    paymentType: paymentType,
                    clothType: order.clothType,
                    fabricDetails: order.fabricDetails
                }
            }
        });
    } catch (error) {
        console.error('Payment initiation error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to initiate payment',
            error: error.message
        });
    }
};

exports.handlePaymentSuccess = async (req, res) => {
    try {
        const { value_a, value_b, value_c, val_id } = req.body;
        
        // Validate the payment with SSLCommerz
        const validationResponse = await sslcommerz.validate({ val_id });

        if (validationResponse.status === 'VALID') {
            // Update payment status
            const payment = await Payment.findById(value_c);
            if (!payment) {
                throw new Error('Payment record not found');
            }

            payment.status = 'completed';
            payment.transactionId = val_id;
            await payment.save();

            // Update order payment status
            const order = await Order.findById(value_a);
            if (!order) {
                throw new Error('Order not found');
            }

            order.paymentStatus = value_b === 'advance' ? 'Partially Paid' : 'Paid';
            await order.save();

            // Redirect to success page with order details
            res.redirect(`/payment-success.html?orderId=${order._id}`);
        } else {
            throw new Error('SSLCommerz payment validation failed');
        }
    } catch (error) {
        console.error('Payment success handling error:', error);
        res.redirect(`/payment-failed.html?error=${encodeURIComponent(error.message)}`);
    }
};

exports.handlePaymentFailure = async (req, res) => {
    try {
        const { value_c } = req.body;

        // Update payment status to failed
        if (value_c) {
            const payment = await Payment.findById(value_c);
            if (payment) {
                payment.status = 'failed';
                await payment.save();
            }
        }

        res.redirect('/payment-failed.html');
    } catch (error) {
        console.error('Payment failure handling error:', error);
        res.redirect('/payment-failed.html');
    }
};

exports.completePayment = async (req, res) => {
    try {
        console.log('=== PAYMENT COMPLETION REQUEST ===');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        console.log('User ID:', req.user.id);
        
        const { orderId, amount, paymentType, paymentMethod, status, transactionId } = req.body;

        // Validate required fields
        if (!orderId || !amount || !paymentType || !paymentMethod || !transactionId) {
            return res.status(400).json({
                status: 'error',
                message: 'Missing required payment fields'
            });
        }

        // Verify order exists and belongs to user
        const order = await Order.findById(orderId)
            .populate('user', 'name email phone')
            .populate('tailor', 'name shopName');

        if (!order) {
            return res.status(404).json({
                status: 'error',
                message: 'Order not found'
            });
        }

        if (order.user._id.toString() !== req.user.id) {
            return res.status(403).json({
                status: 'error',
                message: 'Unauthorized access to this order'
            });
        }

        // Create payment record
        const paymentData = {
            orderId: orderId,
            customerId: req.user.id,
            amount: amount,
            paymentType: paymentType,
            paymentMethod: paymentMethod,
            transactionId: transactionId,
            status: status || 'completed'
        };

        console.log('Creating payment record:', paymentData);
        const payment = await Payment.create(paymentData);
        console.log('✅ Payment record created:', payment._id);

        // Update order payment status
    order.paymentStatus = paymentType === 'advance' ? 'Partially Paid' : 'Paid';
        await order.save();
        console.log('✅ Order payment status updated');

        res.json({
            status: 'success',
            message: 'Payment completed successfully',
            data: {
                paymentId: payment._id,
                transactionId: payment.transactionId,
                amount: payment.amount,
                paymentType: payment.paymentType,
                orderStatus: order.paymentStatus
            }
        });
    } catch (error) {
        console.error('❌ Payment completion error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to complete payment',
            error: error.message
        });
    }
};

exports.getPaymentStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const payment = await Payment.findOne({ orderId }).sort({ createdAt: -1 });

        if (!payment) {
            return res.status(404).json({
                status: 'error',
                message: 'Payment not found'
            });
        }

        res.json({
            status: 'success',
            data: {
                paymentStatus: payment.status,
                amount: payment.amount,
                paymentType: payment.paymentType,
                transactionId: payment.transactionId,
                createdAt: payment.createdAt
            }
        });
    } catch (error) {
        console.error('Get payment status error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get payment status',
            error: error.message
        });
    }
};

exports.getOrderPaymentDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        
        // Get order with payment details
        const order = await Order.findById(orderId)
            .populate('user', 'name email phone')
            .populate('tailor', 'name shopName');
            
        const payment = await Payment.findOne({ orderId }).sort({ createdAt: -1 });

        if (!order) {
            return res.status(404).json({
                status: 'error',
                message: 'Order not found'
            });
        }

        res.json({
            status: 'success',
            data: {
                order: order,
                payment: payment
            }
        });
    } catch (error) {
        console.error('Get order payment details error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get order payment details',
            error: error.message
        });
    }
};
