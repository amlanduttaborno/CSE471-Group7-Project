const jwt = require('jsonwebtoken');
const Tailor = require('../models/Tailor');

exports.protectTailor = async (req, res, next) => {
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

        // 3) Check if tailor still exists
        const tailor = await Tailor.findById(decoded.id);
        if (!tailor) {
            return res.status(401).json({
                status: 'error',
                message: 'The tailor account belonging to this token no longer exists.'
            });
        }

        // Grant access to protected route
        req.tailor = tailor;
        next();
    } catch (error) {
        return res.status(401).json({
            status: 'error',
            message: 'Invalid token. Please log in again.'
        });
    }
};
