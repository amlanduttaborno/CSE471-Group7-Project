// admin/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAdmin } = require('../middleware/authMiddleware');

// 1. Approve new users and tailors
router.get('/pending-users', isAdmin, adminController.getPendingUsers);
router.get('/pending-tailors', isAdmin, adminController.getPendingTailors);
router.post('/approve-user/:id', isAdmin, adminController.approveUser);
router.post('/approve-tailor/:id', isAdmin, adminController.approveTailor);

// 2. Monitor ongoing orders
router.get('/ongoing-orders', isAdmin, adminController.getOngoingOrders);

// 3. Assign tailor to order
router.post('/assign-tailor', isAdmin, adminController.assignTailor);

// 4. Reports
router.get('/order-stats', isAdmin, adminController.getOrderStats);
router.get('/top-customers', isAdmin, adminController.getTopCustomers);
router.get('/top-tailors', isAdmin, adminController.getTopTailors);

module.exports = router;
