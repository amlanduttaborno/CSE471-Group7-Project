const User = require('../models/User');
const Measurement = require('../models/Measurement');
const { logActivity } = require('./activityController');
const mongoose = require('mongoose');

exports.getMeasurements = async (req, res) => {
    try {
        // Get all measurements for the user
        const measurements = await Measurement.find({ userId: req.user._id })
            .sort({ updatedAt: -1 });
        
        res.json({
            status: 'success',
            data: {
                measurements: measurements
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
        console.log('=== MEASUREMENT SAVING REQUEST ===');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        console.log('User ID:', req.user._id);
        
        const { label, garmentType, measurements } = req.body;
        const userId = req.user._id;

        // Validate required fields
        if (!label || !garmentType || !measurements) {
            console.error('Missing required fields:', { label: !!label, garmentType: !!garmentType, measurements: !!measurements });
            return res.status(400).json({
                status: 'error',
                message: 'Label, garment type, and measurements are required'
            });
        }

        console.log('Validation passed, creating measurement...');
        console.log('Garment type:', garmentType);
        console.log('Measurements:', measurements);

        // Create new measurement set - simplified
        const measurementData = {
            userId,
            label,
            garmentType,
            measurements
        };

        console.log('About to save measurement to database...');
        const savedMeasurement = await Measurement.create(measurementData);
        console.log('✅ Measurement saved successfully:', savedMeasurement._id);

        res.json({
            status: 'success',
            message: 'Measurements saved successfully',
            data: {
                measurement: savedMeasurement
            }
        });
    } catch (error) {
        console.error('❌ Save measurements error:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        res.status(500).json({
            status: 'error',
            message: 'Failed to save measurements',
            error: error.message
        });
    }
};

exports.updateMeasurements = async (req, res) => {
    try {
        const { id } = req.params;
        const { label, garmentType, measurements } = req.body;
        const userId = req.user._id;

        // Find the measurement and verify ownership
        const measurement = await Measurement.findOne({ _id: id, userId });
        
        if (!measurement) {
            return res.status(404).json({
                status: 'error',
                message: 'Measurement not found'
            });
        }

        // Update the measurement
        measurement.label = label || measurement.label;
        measurement.garmentType = garmentType || measurement.garmentType;
        measurement.measurements = measurements || measurement.measurements;

        const updatedMeasurement = await measurement.save();

        // Log measurement edited activity
        try {
            await logActivity.measurementEdited(userId, measurement._id);
        } catch (activityError) {
            console.error('Failed to log measurement edited activity:', activityError);
            // Don't fail the request if activity logging fails
        }

        res.json({
            status: 'success',
            message: 'Measurements updated successfully',
            data: {
                measurement: updatedMeasurement
            }
        });
    } catch (error) {
        console.error('Update measurements error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update measurements'
        });
    }
};

exports.deleteMeasurements = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        // Find and delete the measurement
        const measurement = await Measurement.findOneAndDelete({ _id: id, userId });
        
        if (!measurement) {
            return res.status(404).json({
                status: 'error',
                message: 'Measurement not found'
            });
        }

        res.json({
            status: 'success',
            message: 'Measurements deleted successfully'
        });
    } catch (error) {
        console.error('Delete measurements error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete measurements'
        });
    }
};

exports.getMeasurementById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const measurement = await Measurement.findOne({ _id: id, userId });
        
        if (!measurement) {
            return res.status(404).json({
                status: 'error',
                message: 'Measurement not found'
            });
        }

        res.json({
            status: 'success',
            data: {
                measurement: measurement
            }
        });
    } catch (error) {
        console.error('Get measurement by ID error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get measurement'
        });
    }
};
