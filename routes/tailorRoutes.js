const express = require('express');
const router = express.Router();
const { protectTailor } = require('../middleware/auth');
const {
  register,
  login,
  approveTailor
} = require('../controllers/tailorController');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Admin route (TODO: Add admin middleware)
router.put('/:tailorId/approve', approveTailor);

module.exports = router;
