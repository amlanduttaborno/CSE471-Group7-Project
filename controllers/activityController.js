const Activity = require('../models/Activity');
const User = require('../models/User');

// Helper function to create activity
const createActivity = async (userId, type, title, description, metadata = {}, relatedId = null, relatedModel = null, icon = null, iconColor = null) => {
    try {
        const activityData = {
            userId,
            type,
            title,
            description,
            metadata,
            relatedId,
            relatedModel
        };

        // Set default icons and colors based on activity type
        if (!icon) {
            switch (type) {
                case 'profile_updated':
                    activityData.icon = 'fas fa-user-edit';
                    activityData.iconColor = 'text-info';
                    break;
                case 'measurement_added':
                    activityData.icon = 'fas fa-ruler';
                    activityData.iconColor = 'text-success';
                    break;
                case 'measurement_edited':
                    activityData.icon = 'fas fa-edit';
                    activityData.iconColor = 'text-warning';
                    break;
                case 'order_placed':
                    activityData.icon = 'fas fa-shopping-cart';
                    activityData.iconColor = 'text-primary';
                    break;
                case 'order_cancelled':
                    activityData.icon = 'fas fa-times-circle';
                    activityData.iconColor = 'text-danger';
                    break;
                case 'payment_completed':
                    activityData.icon = 'fas fa-credit-card';
                    activityData.iconColor = 'text-success';
                    break;
                case 'review_added':
                    activityData.icon = 'fas fa-star';
                    activityData.iconColor = 'text-warning';
                    break;
                case 'account_created':
                    activityData.icon = 'fas fa-user-plus';
                    activityData.iconColor = 'text-success';
                    break;
                default:
                    activityData.icon = 'fas fa-info-circle';
                    activityData.iconColor = 'text-primary';
            }
        } else {
            activityData.icon = icon;
            activityData.iconColor = iconColor || 'text-primary';
        }

        return await Activity.createActivity(activityData);
    } catch (error) {
        console.error('Error in createActivity helper:', error);
        throw error;
    }
};

// Get user activities
const getUserActivities = async (req, res) => {
    try {
        const userId = req.user._id;
        const limit = parseInt(req.query.limit) || 10;

        const activities = await Activity.getUserActivities(userId, limit);

        res.json({
            success: true,
            activities
        });
    } catch (error) {
        console.error('Error getting user activities:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get activities'
        });
    }
};

// Create activity (admin/system use)
const createUserActivity = async (req, res) => {
    try {
        const { userId, type, title, description, metadata, relatedId, relatedModel } = req.body;

        if (!userId || !type || !title || !description) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const activity = await createActivity(
            userId,
            type,
            title,
            description,
            metadata,
            relatedId,
            relatedModel
        );

        res.json({
            success: true,
            activity
        });
    } catch (error) {
        console.error('Error creating activity:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create activity'
        });
    }
};

// Activity logging helpers for use in other controllers
const logActivity = {
    profileUpdated: async (userId, changes) => {
        const changedFields = Object.keys(changes).join(', ');
        return await createActivity(
            userId,
            'profile_updated',
            'Profile Updated',
            `Updated profile information: ${changedFields}`,
            { changes }
        );
    },

    measurementAdded: async (userId, measurementId) => {
        return await createActivity(
            userId,
            'measurement_added',
            'New Measurements Added',
            'Added new body measurements for tailoring',
            {},
            measurementId,
            'Measurement'
        );
    },

    measurementEdited: async (userId, measurementId) => {
        return await createActivity(
            userId,
            'measurement_edited',
            'Measurements Updated',
            'Updated existing body measurements',
            {},
            measurementId,
            'Measurement'
        );
    },

    orderPlaced: async (userId, orderId, tailorName) => {
        return await createActivity(
            userId,
            'order_placed',
            'Order Placed',
            `Placed new order with ${tailorName}`,
            { tailorName },
            orderId,
            'Order'
        );
    },

    orderCancelled: async (userId, orderId) => {
        return await createActivity(
            userId,
            'order_cancelled',
            'Order Cancelled',
            'Cancelled an order',
            {},
            orderId,
            'Order'
        );
    },

    paymentCompleted: async (userId, paymentId, amount) => {
        return await createActivity(
            userId,
            'payment_completed',
            'Payment Completed',
            `Payment of $${amount} completed successfully`,
            { amount },
            paymentId,
            'Payment'
        );
    },

    reviewAdded: async (userId, reviewId, tailorName) => {
        return await createActivity(
            userId,
            'review_added',
            'Review Added',
            `Added review for ${tailorName}`,
            { tailorName },
            reviewId,
            'Review'
        );
    },

    accountCreated: async (userId) => {
        return await createActivity(
            userId,
            'account_created',
            'Account Created',
            'Welcome! Your account has been created successfully',
            {}
        );
    }
};

module.exports = {
    getUserActivities,
    createUserActivity,
    createActivity,
    logActivity
};
