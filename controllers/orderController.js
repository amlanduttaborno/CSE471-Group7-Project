const Order = require('../models/Order');
const Measurement = require('../models/Measurement');
const User = require('../models/User');

// Create new order with measurements
exports.createOrder = async (req, res) => {
    try {
        console.log('=== ORDER CREATION REQUEST ===');
        console.log('Request received at:', new Date().toISOString());
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        console.log('User from token:', req.user ? req.user.id : 'No user');
        console.log('Headers:', req.headers.authorization ? 'Has auth header' : 'No auth header');
        
        const {
            tailorId,
            measurements,
            fabricDetails,
            garmentType,
            expectedDeliveryDate,
            specialInstructions,
            saveMeasurements,
            estimatedPrice
        } = req.body;

        console.log('Extracted order data:', {
            tailorId,
            garmentType,
            estimatedPrice,
            saveMeasurements,
            userId: req.user?.id
        });

        if (!req.user || !req.user.id) {
            console.error('No authenticated user found');
            return res.status(401).json({
                status: 'error',
                message: 'User authentication required'
            });
        }

        if (!tailorId) {
            console.error('No tailor ID provided');
            return res.status(400).json({
                status: 'error',
                message: 'Tailor ID is required'
            });
        }

        // Create measurements document if saveMeasurements is true
        let measurementDoc = null;
        if (saveMeasurements && measurements) {
            try {
                measurementDoc = await Measurement.create({
                    userId: req.user.id,
                    garmentType: garmentType,
                    measurements: measurements,
                    label: `${garmentType} - ${new Date().toLocaleDateString()}`
                });
                console.log('Measurements saved:', measurementDoc._id);
            } catch (measurementError) {
                console.error('Error saving measurements:', measurementError);
                // Don't fail the order creation if measurements save fails
            }
        }

        // Create order
        console.log('Creating order in database...');
        console.log('FabricDetails received:', fabricDetails);
        
        // Ensure fabricDetails matches the schema structure
        const processedFabricDetails = {
            provider: fabricDetails?.provider || 'customer',
            type: fabricDetails?.type ? String(fabricDetails.type) : '',
            color: fabricDetails?.color ? String(fabricDetails.color) : '',
            secondaryColor: fabricDetails?.secondaryColor ? String(fabricDetails.secondaryColor) : '',
            pattern: fabricDetails?.pattern ? String(fabricDetails.pattern) : '',
            weight: fabricDetails?.weight ? String(fabricDetails.weight) : '',
            texture: fabricDetails?.texture ? String(fabricDetails.texture) : '',
            quantity: fabricDetails?.quantity ? parseFloat(fabricDetails.quantity) : 0,
            width: fabricDetails?.width ? String(fabricDetails.width) : '',
            finishing: Array.isArray(fabricDetails?.finishing) ? fabricDetails.finishing : [],
            careInstructions: fabricDetails?.careInstructions ? String(fabricDetails.careInstructions) : '',
            budget: fabricDetails?.budget ? parseFloat(fabricDetails.budget) : 0,
            source: fabricDetails?.source ? String(fabricDetails.source) : ''
        };
        
        console.log('Processed fabricDetails:', processedFabricDetails);
        
        // Process expectedDeliveryDate
        let deliveryDate;
        if (expectedDeliveryDate) {
            deliveryDate = new Date(expectedDeliveryDate);
            // Ensure the date is valid
            if (isNaN(deliveryDate.getTime())) {
                // If invalid date, set to 7 days from now
                deliveryDate = new Date();
                deliveryDate.setDate(deliveryDate.getDate() + 7);
            }
        } else {
            // Default to 7 days from now
            deliveryDate = new Date();
            deliveryDate.setDate(deliveryDate.getDate() + 7);
        }
        
        console.log('Processed delivery date:', deliveryDate);
        
        const order = await Order.create({
            user: req.user.id,
            tailor: tailorId,
            garmentType: garmentType, // Use garmentType field instead of clothType
            clothType: garmentType, // Keep clothType for backward compatibility
            measurements: measurements,
            fabricDetails: processedFabricDetails,
            estimatedPrice: estimatedPrice,
            totalAmount: estimatedPrice,
            expectedDeliveryDate: deliveryDate,
            specialInstructions,
            status: 'Pending', // Use title case to match enum
            paymentStatus: 'Pending' // Use title case to match enum
        });

        console.log('✅ Order created successfully:', {
            orderId: order._id,
            user: order.user,
            tailor: order.tailor,
            clothType: order.clothType,
            totalAmount: order.totalAmount
        });

        res.status(201).json({
            status: 'success',
            message: 'Order created successfully',
            data: {
                orderId: order._id,
                order: order,
                measurementsSaved: measurementDoc ? true : false
            },
            redirectTo: `/payment-receipt.html?orderId=${order._id}`
        });
    } catch (error) {
        console.error('❌ Order creation error:', error);
        console.error('Error stack:', error.stack);
        
        // Handle different types of errors
        let errorMessage = 'Failed to create order';
        let statusCode = 500;
        
        if (error.name === 'ValidationError') {
            // Mongoose validation error
            statusCode = 400;
            const validationErrors = Object.values(error.errors).map(err => err.message);
            errorMessage = `Validation failed: ${validationErrors.join(', ')}`;
        } else if (error.name === 'CastError') {
            // Mongoose cast error
            statusCode = 400;
            errorMessage = `Invalid data format: ${error.message}`;
        } else if (error.code === 11000) {
            // Duplicate key error
            statusCode = 400;
            errorMessage = 'Duplicate entry found';
        }
        
        res.status(statusCode).json({
            status: 'error',
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

// Get user's orders with full tailor information for dashboard
exports.getUserOrdersWithTailors = async (req, res) => {
    try {
        console.log('=== GET USER ORDERS DEBUG ===');
        console.log('req.user:', req.user ? 'exists' : 'null');
        console.log('req.user._id:', req.user?._id);
        console.log('req.user.id:', req.user?.id);
        
        const userId = req.user._id || req.user.id;
        console.log('Using userId:', userId);
        
        const orders = await Order.find({ user: userId })
            .populate('tailor', 'name email profilePicture specializations experience location bio isApproved averageRating totalReviews')
            .populate('measurements')
            .sort('-createdAt');

        console.log('Found orders count:', orders.length);
        console.log('Orders:', orders.map(o => ({ id: o._id, status: o.status, user: o.user })));

        res.json({
            success: true,
            orders
        });
    } catch (error) {
        console.error('Get user orders with tailors error:', error);
        res.status(500).json({
            success: false,
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

// Get tailor's orders
exports.getTailorOrderDetails = async (req, res) => {
    try {
        console.log('getTailorOrderDetails called for order:', req.params.orderId);
        console.log('req.tailor:', req.tailor ? req.tailor._id : 'No tailor in request');
        
        if (!req.tailor || !req.tailor._id) {
            return res.status(401).json({
                status: 'error',
                message: 'Tailor authentication required'
            });
        }

        const order = await Order.findById(req.params.orderId)
            .populate('user', 'name email phoneNumber phone')
            .populate('tailor', 'name shopName');

        if (!order) {
            return res.status(404).json({
                status: 'error',
                message: 'Order not found'
            });
        }

        // Check if order belongs to this tailor
        if (order.tailor._id.toString() !== req.tailor._id.toString()) {
            return res.status(403).json({
                status: 'error',
                message: 'Not authorized to view this order'
            });
        }

        console.log('Order details retrieved successfully for tailor');

        res.json({
            status: 'success',
            data: {
                order
            }
        });
    } catch (error) {
        console.error('Get tailor order details error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get order details',
            error: error.message
        });
    }
};

exports.getTailorOrders = async (req, res) => {
    try {
        console.log('getTailorOrders called');
        console.log('req.tailor:', req.tailor ? req.tailor._id : 'No tailor in request');
        
        if (!req.tailor || !req.tailor._id) {
            return res.status(401).json({
                status: 'error',
                message: 'Tailor authentication required'
            });
        }

        const orders = await Order.find({ tailor: req.tailor._id })
            .populate('user', 'name email phoneNumber phone')
            .populate('measurements')
            .sort('-createdAt');

        console.log('Found orders for tailor:', orders.length);

        res.json({
            status: 'success',
            data: {
                orders
            }
        });
    } catch (error) {
        console.error('Get tailor orders error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get tailor orders',
            error: error.message
        });
    }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, notes } = req.body;
        const tailorId = req.tailor._id;

        console.log('🔍 DEBUG: updateOrderStatus called');
        console.log('   Order ID:', orderId);
        console.log('   Tailor ID:', tailorId);
        console.log('   New Status:', status);
        console.log('   Notes:', notes);
        console.log('   Tailor object:', req.tailor ? 'EXISTS' : 'NULL');

        console.log(`🔄 Tailor ${tailorId} updating order ${orderId} status to: ${status}`);
        console.log(`📝 Notes: ${notes || 'No notes provided'}`);

        // Validate required fields
        if (!status) {
            return res.status(400).json({
                status: 'error',
                message: 'Status is required'
            });
        }

        // Valid status options
        const validStatuses = [
            'Pending',
            'Accepted', 
            'Fabric Collection',
            'In Progress',
            'Ready for Trial',
            'Alterations',
            'Completed',
            'Delivered',
            'Cancelled'
        ];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid status provided'
            });
        }

        // Find the order and verify it belongs to this tailor
        const order = await Order.findOne({ 
            _id: orderId, 
            tailor: tailorId 
        });

        if (!order) {
            return res.status(404).json({
                status: 'error',
                message: 'Order not found or you do not have permission to update this order'
            });
        }

        // Store previous status for logging
        const previousStatus = order.status;

        // Update order status and add to history using findOneAndUpdate to avoid full document validation
        const updateData = {
            status: status,
            $push: {
                statusHistory: {
                    status: status,
                    timestamp: new Date(),
                    notes: notes || `Status changed from ${previousStatus} to ${status}`
                }
            }
        };

        const updatedOrder = await Order.findOneAndUpdate(
            { _id: orderId, tailor: tailorId },
            updateData,
            { 
                new: true, 
                runValidators: false // Skip validation to avoid issues with existing data
            }
        );

        console.log(`✅ Order ${orderId} status updated successfully`);
        console.log(`   Previous: ${previousStatus} → New: ${status}`);

        res.json({
            status: 'success',
            message: 'Order status updated successfully',
            data: {
                orderId: updatedOrder._id,
                previousStatus,
                newStatus: status,
                notes: notes || null,
                updatedAt: new Date(),
                order: updatedOrder
            }
        });

    } catch (error) {
        console.error('❌ Update order status error:', error);
        console.error('   Order ID:', req.params.orderId);
        console.error('   Tailor ID:', req.tailor?._id);
        console.error('   Request body:', req.body);
        console.error('   Error details:', error.message);
        
        res.status(500).json({
            status: 'error',
            message: 'Failed to update order status',
            error: error.message,
            debug: {
                orderId: req.params.orderId,
                tailorId: req.tailor?._id,
                requestBody: req.body
            }
        });
    }
};

// Test utility function to create a delivered order for review testing
exports.createTestDeliveredOrder = async (req, res) => {
    try {
        console.log('🧪 Creating test delivered order for review testing...');
        
        const testOrder = new Order({
            user: req.user._id,
            tailor: req.body.tailorId, // Should be provided in request
            garmentType: 'Kurti',
            status: 'Delivered',
            totalPrice: 1500,
            fabricDetails: {
                type: 'Cotton',
                color: 'Blue',
                quantity: '2 meters'
            },
            measurements: {
                chest: '36',
                waist: '32',
                hips: '38',
                length: '42'
            },
            specialInstructions: 'Test order for review functionality',
            expectedDeliveryDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            orderDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // 14 days ago
        });

        const savedOrder = await testOrder.save();
        
        // Populate the order with user and tailor details
        const populatedOrder = await Order.findById(savedOrder._id)
            .populate('user', 'name email')
            .populate('tailor', 'name email');

        console.log('✅ Test delivered order created:', populatedOrder._id);

        res.json({
            status: 'success',
            message: 'Test delivered order created successfully',
            data: {
                order: populatedOrder
            }
        });

    } catch (error) {
        console.error('❌ Error creating test order:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to create test order',
            error: error.message
        });
    }
};
