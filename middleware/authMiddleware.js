const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    try {
        // 1) Get token
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'You are not logged in. Please log in to get access.'
            });
        }

        // 2) Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3) Check if user still exists
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'The user belonging to this token no longer exists.'
            });
        }

        // 4) Check if user is verified
        if (!user.isVerified) {
            return res.status(403).json({
                status: 'error',
                message: 'Please verify your email to access this resource.'
            });
        }

        // Grant access to protected route
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            status: 'error',
            message: 'Invalid token. Please log in again.'
        });
    }
};

exports.isAdmin = async (req, res, next) => {
    // Use protect middleware to get user
    await exports.protect(req, res, async function() {
        if (!req.user.isAdmin) {
            return res.status(403).json({
                status: 'error',
                message: 'Access denied. Admins only.'
            });
        }
        next();
    });
};
