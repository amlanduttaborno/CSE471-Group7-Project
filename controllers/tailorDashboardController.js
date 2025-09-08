const Tailor = require('../models/Tailor');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Payment = require('../models/Payment');

// Get Tailor Dashboard Stats
exports.getTailorStats = async (req, res) => {
    try {
        const tailorId = req.tailor._id;

        const stats = {
            pendingOrders: await Order.countDocuments({ 
                tailor: tailorId, 
                status: 'Pending'
            }),
            completedOrders: await Order.countDocuments({ 
                tailor: tailorId, 
                status: 'Completed'
            }),
            totalEarnings: await Payment.aggregate([
                { $match: { tailor: tailorId } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]).then(result => result[0]?.total || 0),
            averageRating: await Review.aggregate([
                { $match: { tailor: tailorId } },
                { $group: { _id: null, avg: { $avg: '$rating' } } }
            ]).then(result => result[0]?.avg || 0)
        };

        // Additional stats
        stats.todayEarnings = await Payment.aggregate([
            {
                $match: {
                    tailor: tailorId,
                    createdAt: {
                        $gte: new Date(new Date().setHours(0,0,0,0))
                    }
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]).then(result => result[0]?.total || 0);

        // Week earnings
        stats.weekEarnings = await Payment.aggregate([
            {
                $match: {
                    tailor: tailorId,
                    createdAt: {
                        $gte: new Date(new Date().setDate(new Date().getDate() - 7))
                    }
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]).then(result => result[0]?.total || 0);

        // Month earnings
        stats.monthEarnings = await Payment.aggregate([
            {
                $match: {
                    tailor: tailorId,
                    createdAt: {
                        $gte: new Date(new Date().setMonth(new Date().getMonth() - 1))
                    }
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]).then(result => result[0]?.total || 0);

        // Year earnings
        stats.yearEarnings = await Payment.aggregate([
            {
                $match: {
                    tailor: tailorId,
                    createdAt: {
                        $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1))
                    }
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]).then(result => result[0]?.total || 0);

        res.status(200).json({
            status: 'success',
            data: stats
        });

    } catch (error) {
        console.error('Error fetching tailor stats:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch dashboard statistics',
            error: error.message
        });
    }
};

// Get Recent Orders
exports.getRecentOrders = async (req, res) => {
    try {
        const tailorId = req.tailor._id;
        const recentOrders = await Order.find({ tailor: tailorId })
            .populate('user', 'name email phoneNumber phone')
            .populate('measurements')
            .sort({ createdAt: -1 })
            .limit(10); // Increased to 10 to match frontend

        res.status(200).json({
            status: 'success',
            data: {
                orders: recentOrders
            }
        });

    } catch (error) {
        console.error('Error fetching recent orders:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch recent orders',
            error: error.message
        });
    }
};

// Get Recent Reviews
exports.getRecentReviews = async (req, res) => {
    try {
        const tailorId = req.tailor._id;
        const recentReviews = await Review.find({ tailor: tailorId })
            .populate('customer', 'name')
            .sort({ createdAt: -1 })
            .limit(3);

        res.status(200).json({
            status: 'success',
            data: {
                reviews: recentReviews
            }
        });

    } catch (error) {
        console.error('Error fetching recent reviews:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch recent reviews',
            error: error.message
        });
    }
};

// Get Earnings Data
exports.getEarningsData = async (req, res) => {
    try {
        const tailorId = req.tailor._id;
        const period = req.query.period || 'month';

        let dateRange;
        let groupBy;

        switch (period) {
            case 'week':
                dateRange = new Date(new Date().setDate(new Date().getDate() - 7));
                groupBy = { $dayOfWeek: '$createdAt' };
                break;
            case 'month':
                dateRange = new Date(new Date().setMonth(new Date().getMonth() - 1));
                groupBy = { $dayOfMonth: '$createdAt' };
                break;
            case 'year':
                dateRange = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
                groupBy = { $month: '$createdAt' };
                break;
            default:
                dateRange = new Date(new Date().setMonth(new Date().getMonth() - 1));
                groupBy = { $dayOfMonth: '$createdAt' };
        }

        const earnings = await Payment.aggregate([
            {
                $match: {
                    tailor: tailorId,
                    createdAt: { $gte: dateRange }
                }
            },
            {
                $group: {
                    _id: groupBy,
                    total: { $sum: '$amount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Format data for chart
        const labels = earnings.map(e => e._id.toString());
        const values = earnings.map(e => e.total);

        res.status(200).json({
            status: 'success',
            data: {
                labels,
                values
            }
        });

    } catch (error) {
        console.error('Error fetching earnings data:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch earnings data',
            error: error.message
        });
    }
};
