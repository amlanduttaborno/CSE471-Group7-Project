const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        required: true,
        enum: [
            'profile_updated',
            'measurement_added',
            'measurement_edited',
            'order_placed',
            'order_cancelled',
            'payment_completed',
            'review_added',
            'account_created'
        ]
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    relatedModel: {
        type: String,
        enum: ['Order', 'Measurement', 'Payment', 'Review'],
        default: null
    },
    icon: {
        type: String,
        default: 'fas fa-info-circle'
    },
    iconColor: {
        type: String,
        default: 'text-primary'
    }
}, {
    timestamps: true
});

// Index for efficient querying
activitySchema.index({ userId: 1, createdAt: -1 });

// Static method to create activity
activitySchema.statics.createActivity = async function(activityData) {
    try {
        const activity = new this(activityData);
        await activity.save();
        return activity;
    } catch (error) {
        console.error('Error creating activity:', error);
        throw error;
    }
};

// Static method to get user activities
activitySchema.statics.getUserActivities = async function(userId, limit = 10) {
    try {
        return await this.find({ userId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
    } catch (error) {
        console.error('Error getting user activities:', error);
        throw error;
    }
};

module.exports = mongoose.model('Activity', activitySchema);
