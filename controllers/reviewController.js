const Review = require('../models/Review');
const Order = require('../models/Order');

exports.createReview = async (req, res) => {
    try {
        const { orderId, rating, feedback } = req.body;
        
        // Validate order exists and belongs to user
        const order = await Order.findOne({
            _id: orderId,
            customerId: req.user._id,
            status: 'Delivered' // Can only review completed orders
        });
        
        if (!order) {
            return res.status(404).json({
                status: 'error',
                message: 'Order not found or not eligible for review'
            });
        }

        // Check if review already exists
        const existingReview = await Review.findOne({
            orderId,
            customerId: req.user._id
        });

        if (existingReview) {
            return res.status(400).json({
                status: 'error',
                message: 'Review already exists for this order'
            });
        }

        // Create review
        const review = new Review({
            tailorId: order.tailorId,
            customerId: req.user._id,
            orderId,
            rating,
            feedback
        });

        await review.save();

        res.json({
            status: 'success',
            data: {
                review
            }
        });
    } catch (error) {
        console.error('Review creation error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to create review'
        });
    }
};

exports.getTailorReviews = async (req, res) => {
    try {
        const { tailorId } = req.params;
        
        const reviews = await Review.find({ tailorId })
            .populate('customerId', 'name')
            .sort({ createdAt: -1 });

        // Calculate average rating
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

        res.json({
            status: 'success',
            data: {
                reviews,
                averageRating,
                totalReviews: reviews.length
            }
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get reviews'
        });
    }
};
