const express = require('express');
const router = express.Router();
const { protectTailor } = require('../middleware/tailorAuth');
const upload = require('../middleware/uploadMiddleware');
const {
    register,
    login,
    approveTailor,
    verifyEmail,
    updateProfile,
    getTailorProfile,
    updateProfilePicture,
    getAllApprovedTailors
} = require('../controllers/tailorController');
const {
    getTailorOrders,
    updateOrderStatus,
    getTailorOrderDetails
} = require('../controllers/orderController');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.get('/', getAllApprovedTailors); // Get all approved tailors for customers

// Protected routes
router.use(protectTailor);  // Apply tailor authentication middleware

// Profile routes
router.get('/profile', getTailorProfile);
router.put('/profile', updateProfile);
router.post('/profile/image', upload.single('profilePicture'), updateProfilePicture);

// Order routes
router.get('/orders', getTailorOrders);
router.get('/orders/:orderId', getTailorOrderDetails);
router.put('/orders/:orderId/status', updateOrderStatus);

// Admin route (TODO: Add admin middleware)
// router.put('/:tailorId/approve', approveTailor); // Disabled for now

module.exports = router;