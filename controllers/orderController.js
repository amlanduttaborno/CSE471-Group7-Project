const Order = require('../models/Order');
const Measurement = require('../models/Measurement');
const User = require('../models/User');

// Create new order with measurements
exports.createOrder = async (req, res) => {
    try {
        const {
            tailorId,
            clothType,
            measurements,
            fabricDetails,
            price,
            expectedDeliveryDate,
            specialInstructions
        } = req.body;

        // Create or update measurements
        let measurementDoc;
        if (req.user.measurements) {
            // Update existing measurements
            measurementDoc = await Measurement.findByIdAndUpdate(
                req.user.measurements,
                { measurements },
                { new: true }
            );
        } else {
            // Create new measurements
            measurementDoc = await Measurement.create({
                user: req.user.id,
                measurements
            });

            // Update user with measurement reference
            await User.findByIdAndUpdate(req.user.id, {
                measurements: measurementDoc._id
            });
        }

        // Create order
        const order = await Order.create({
            user: req.user.id,
            tailor: tailorId,
            clothType,
            measurements: measurementDoc._id,
            fabricDetails,
            price,
            expectedDeliveryDate,
            specialInstructions,
            status: 'Pending'
        });

        res.status(201).json({
            status: 'success',
            data: {
                order,
                measurements: measurementDoc
            }
        });
    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to create order',
            error: error.message
        });
    }
};

// Get user's measurements
exports.getMeasurements = async (req, res) => {
    try {
        const measurements = await Measurement.findById(req.user.measurements);
        
        if (!measurements) {
            return res.status(404).json({
                status: 'error',
                message: 'No measurements found'
            });
        }

        res.json({
            status: 'success',
            data: {
                measurements
            }
        });
    } catch (error) {
        console.error('Get measurements error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get measurements',
            error: error.message
        });
    }
};

// Update measurements
exports.updateMeasurements = async (req, res) => {
    try {
        const { measurements } = req.body;

        const updatedMeasurements = await Measurement.findByIdAndUpdate(
            req.user.measurements,
            { measurements },
            { new: true }
        );

        res.json({
            status: 'success',
            data: {
                measurements: updatedMeasurements
            }
        });
    } catch (error) {
        console.error('Update measurements error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update measurements',
            error: error.message
        });
    }
};

// Get user's orders
exports.getOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id })
            .populate('tailor', 'name')
            .sort('-createdAt');

        res.json({
            status: 'success',
            data: {
                orders
            }
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get orders',
            error: error.message
        });
    }
};

// Get order details
exports.getOrderDetails = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate('tailor', 'name')
            .populate('measurements');

        if (!order) {
            return res.status(404).json({
                status: 'error',
                message: 'Order not found'
            });
        }

        // Check if order belongs to user
        if (order.user.toString() !== req.user.id) {
            return res.status(403).json({
                status: 'error',
                message: 'Not authorized to view this order'
            });
        }

        res.json({
            status: 'success',
            data: {
                order
            }
        });
    } catch (error) {
        console.error('Get order details error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get order details',
            error: error.message
        });
    }
};
