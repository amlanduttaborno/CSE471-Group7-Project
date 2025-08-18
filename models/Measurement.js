const mongoose = require('mongoose');

const measurementSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    measurements: {
        chest: {
            type: Number,
            required: true
        },
        waist: {
            type: Number,
            required: true
        },
        hips: {
            type: Number,
            required: true
        },
        shoulder: {
            type: Number,
            required: true
        },
        sleeveLength: {
            type: Number,
            required: true
        },
        length: {
            type: Number,
            required: true
        },
        neck: {
            type: Number,
            required: true
        },
        inseam: {
            type: Number,
            required: false
        },
        thigh: {
            type: Number,
            required: false
        },
        calf: {
            type: Number,
            required: false
        }
    },
    notes: {
        type: String,
        trim: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Measurement', measurementSchema);
