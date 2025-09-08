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
    garmentType: {
        type: String,
        required: true
    },
    clothType: {
        type: String,
        required: false // Making this optional since we have garmentType
    },
    measurements: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    fabricDetails: {
        provider: {
            type: String,
            enum: ['customer', 'tailor'],
            default: 'customer'
        },
        type: {
            type: String,
            default: ''
        },
        color: {
            type: String,
            default: ''
        },
        secondaryColor: {
            type: String,
            default: ''
        },
        pattern: {
            type: String,
            default: ''
        },
        weight: {
            type: String,
            default: ''
        },
        texture: {
            type: String,
            default: ''
        },
        quantity: {
            type: Number,
            default: 0
        },
        width: {
            type: String,
            default: ''
        },
        finishing: {
            type: [String],
            default: []
        },
        careInstructions: {
            type: String,
            default: ''
        },
        budget: {
            type: Number,
            default: 0
        },
        source: {
            type: String,
            default: ''
        }
    },
    style: String,
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
    estimatedPrice: {
        type: Number,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true // Make this required since it's being set by the controller
    },
    expectedDeliveryDate: {
        type: Date,
        required: true
    },
    specialInstructions: {
        type: String,
        trim: true
    },
    additionalNotes: {
        type: String,
        trim: true
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Partially Paid', 'Paid', 'Refunded'],
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
