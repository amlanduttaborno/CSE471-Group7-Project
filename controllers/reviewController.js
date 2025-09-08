const Review = require('../models/Review');
const Order = require('../models/Order');
const Tailor = require('../models/Tailor');

exports.createReview = async (req, res) => {
    try {
        const { orderId, rating, feedback } = req.body;
        
        console.log('Creating review for order:', orderId);
        console.log('User ID:', req.user._id);
        console.log('Rating:', rating, 'Feedback:', feedback);
        
        // Validate order exists and belongs to user
        const order = await Order.findOne({
            _id: orderId,
            user: req.user._id,
            status: 'Delivered' // Can only review delivered orders
        });
        
        if (!order) {
            return res.status(404).json({
                status: 'error',
                message: 'Order not found or not eligible for review. Order must be delivered to leave a review.'
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
                message: 'You have already reviewed this order'
            });
        }

        // Create review
        const review = new Review({
            tailorId: order.tailor,
            customerId: req.user._id,
            orderId,
            rating: parseInt(rating),
            feedback
        });

        await review.save();

        // Update tailor's average rating
        await updateTailorAverageRating(order.tailor);

        // Populate the review for response
        const populatedReview = await Review.findById(review._id)
            .populate('customerId', 'name email')
            .populate('orderId', 'garmentType createdAt');

        res.json({
            status: 'success',
            message: 'Review submitted successfully',
            data: {
                review: populatedReview
            }
        });
    } catch (error) {
        console.error('Review creation error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to create review',
            error: error.message
        });
    }
};

exports.getTailorReviews = async (req, res) => {
    try {
        const { tailorId } = req.params;
        
        const reviews = await Review.find({ tailorId })
            .populate('customerId', 'name email')
            .populate('orderId', 'garmentType createdAt')
            .sort({ createdAt: -1 });

        // Calculate average rating
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;

        res.json({
            status: 'success',
            data: {
                reviews,
                averageRating: parseFloat(averageRating),
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

exports.getUserReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ customerId: req.user._id })
            .populate('tailorId', 'name email')
            .populate('orderId', 'garmentType createdAt')
            .sort({ createdAt: -1 });

        res.json({
            status: 'success',
            data: {
                reviews
            }
        });
    } catch (error) {
        console.error('Get user reviews error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get user reviews'
        });
    }
};

exports.checkReviewEligibility = async (req, res) => {
    try {
        const { orderId } = req.params;
        
        // Check if order exists, belongs to user, and is delivered
        const order = await Order.findOne({
            _id: orderId,
            user: req.user._id,
            status: 'Delivered'
        });
        
        if (!order) {
            return res.json({
                status: 'success',
                data: {
                    eligible: false,
                    reason: 'Order not found or not delivered yet'
                }
            });
        }

        // Check if review already exists
        const existingReview = await Review.findOne({
            orderId,
            customerId: req.user._id
        });

        if (existingReview) {
            return res.json({
                status: 'success',
                data: {
                    eligible: false,
                    reason: 'Already reviewed',
                    existingReview
                }
            });
        }

        res.json({
            status: 'success',
            data: {
                eligible: true,
                order
            }
        });
    } catch (error) {
        console.error('Review eligibility check error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to check review eligibility'
        });
    }
};

// Helper function to update tailor's average rating
async function updateTailorAverageRating(tailorId) {
    try {
        const reviews = await Review.find({ tailorId });
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;
        
        await Tailor.findByIdAndUpdate(tailorId, {
            averageRating: parseFloat(averageRating.toFixed(1)),
            totalReviews: reviews.length
        });
        
        console.log(`Updated tailor ${tailorId} rating: ${averageRating.toFixed(1)} (${reviews.length} reviews)`);
    } catch (error) {
        console.error('Error updating tailor average rating:', error);
    }
}
