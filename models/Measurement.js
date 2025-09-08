const mongoose = require('mongoose');

const measurementSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    label: {
        type: String,
        required: true,
        trim: true
    },
    garmentType: {
        type: String,
        required: true
        // Removed enum restriction to allow all garment types
    },
    measurements: {
        type: Map,
        of: String,
        required: true
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Index for efficient querying
measurementSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('Measurement', measurementSchema);
