const User = require('../models/User');
const mongoose = require('mongoose');

// Define Measurement Schema
const measurementSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    measurements: {
        chest: Number,
        waist: Number,
        hips: Number,
        shoulder: Number,
        sleeveLength: Number,
        length: Number,
        neck: Number,
        inseam: Number,
        thigh: Number
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

const Measurement = mongoose.model('Measurement', measurementSchema);

exports.getMeasurements = async (req, res) => {
    try {
        // Get measurements from user's profile
        const user = await User.findById(req.user.id).populate('measurements');
        
        if (!user.measurements) {
            return res.json({
                status: 'success',
                data: {
                    measurements: {
                        measurements: {
                            chest: '',
                            waist: '',
                            hips: '',
                            shoulder: '',
                            sleeveLength: '',
                            length: '',
                            neck: '',
                            inseam: '',
                            thigh: ''
                        }
                    }
                }
            });
        }

        res.json({
            status: 'success',
            data: {
                measurements: user.measurements
            }
        });
    } catch (error) {
        console.error('Get measurements error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get measurements'
        });
    }
};

exports.saveMeasurements = async (req, res) => {
    try {
        const measurements = req.body;
        const userId = req.user.id;

        let user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        // Create or update measurements
        if (!user.measurements) {
            const newMeasurement = new Measurement({
                userId,
                measurements: measurements
            });
            const savedMeasurement = await newMeasurement.save();
            user.measurements = savedMeasurement._id;
            await user.save();
        } else {
            await Measurement.findByIdAndUpdate(user.measurements, {
                measurements: measurements,
                lastUpdated: Date.now()
            });
        }

        res.json({
            status: 'success',
            message: 'Measurements saved successfully'
        });
    } catch (error) {
        console.error('Save measurements error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to save measurements'
        });
    }
};
