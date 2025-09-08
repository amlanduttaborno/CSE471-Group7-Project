const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

// Create a review (customers only)
router.post('/create', protect, reviewController.createReview);

// Get all reviews for a tailor
router.get('/tailor/:tailorId', reviewController.getTailorReviews);

// Get all reviews by current user
router.get('/my-reviews', protect, reviewController.getUserReviews);

// Check if user can review an order
router.get('/check-eligibility/:orderId', protect, reviewController.checkReviewEligibility);

module.exports = router;