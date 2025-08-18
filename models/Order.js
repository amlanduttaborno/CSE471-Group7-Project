const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tailor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tailor',
        required: true
    },
    clothType: {
        type: String,
        required: true,
        enum: [
            'Suits',
            'Dresses',
            'Shirts',
            'Pants',
            'Skirts',
            'Blazers',
            'Evening Gowns',
            'Wedding Dresses',
            'Business Attire',
            'Casual Wear',
            'Formal Wear',
            'Alterations'
        ]
    },
    measurements: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Measurement',
        required: true
    },
    fabricDetails: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: [
            'Pending',
            'Accepted',
            'Fabric Collection',
            'In Progress',
            'Ready for Trial',
            'Alterations',
            'Completed',
            'Delivered',
            'Cancelled'
        ],
        default: 'Pending'
    },
    statusHistory: [{
        status: {
            type: String,
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        },
        notes: String
    }],
    price: {
        type: Number,
        required: true
    },
    expectedDeliveryDate: {
        type: Date,
        required: true
    },
    specialInstructions: {
        type: String,
        trim: true
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Partial', 'Completed'],
        default: 'Pending'
    },
    paymentHistory: [{
        amount: Number,
        date: {
            type: Date,
            default: Date.now
        },
        method: String
    }]
}, {
    timestamps: true
});

// Add status to history whenever status changes
orderSchema.pre('save', function(next) {
    if (this.isModified('status')) {
        this.statusHistory.push({
            status: this.status,
            date: new Date(),
            notes: 'Status updated'
        });
    }
    next();
});

module.exports = mongoose.model('Order', orderSchema);
