const express = require('express');
const router = express.Router();
const Tailor = require('../models/Tailor');
const bcrypt = require('bcryptjs');

// Test endpoint to create sample tailors (temporary)
router.post('/create-test-tailors', async (req, res) => {
    try {
        // Check if tailors already exist
        const existingTailors = await Tailor.find({});
        
        if (existingTailors.length > 0) {
            return res.json({
                success: true,
                message: 'Tailors already exist',
                count: existingTailors.length
            });
        }

        const testTailors = [
            {
                name: 'Aisha Rahman',
                email: 'aisha@example.com',
                password: await bcrypt.hash('password123', 10),
                experience: 8,
                specialization: ['kurti', 'salwar-kameez', 'sharee-blouse'],
                shopName: 'Aisha Tailoring',
                shopAddress: {
                    street: '123 Dhanmondi Road',
                    city: 'Dhaka',
                    state: 'Dhaka',
                    zipCode: '1205'
                },
                phoneNumber: '+8801712345678',
                isApproved: true,
                bio: 'Expert in traditional and modern designs with 8 years of experience.'
            },
            {
                name: 'Fatima Khatun',
                email: 'fatima@example.com',
                password: await bcrypt.hash('password123', 10),
                experience: 12,
                specialization: ['lehenga', 'anarkali', 'burkha'],
                shopName: 'Fatima Fashion House',
                shopAddress: {
                    street: '456 Gulshan Avenue',
                    city: 'Dhaka',
                    state: 'Dhaka',
                    zipCode: '1212'
                },
                phoneNumber: '+8801823456789',
                isApproved: true,
                bio: 'Specializing in bridal wear and formal outfits for 12 years.'
            },
            {
                name: 'Rashida Begum',
                email: 'rashida@example.com',
                password: await bcrypt.hash('password123', 10),
                experience: 15,
                specialization: ['three-piece', 'palazzo-set', 'gharara'],
                shopName: 'Rashida Boutique',
                shopAddress: {
                    street: '789 Uttara Sector 7',
                    city: 'Dhaka',
                    state: 'Dhaka',
                    zipCode: '1230'
                },
                phoneNumber: '+8801934567890',
                isApproved: true,
                bio: 'Master tailor with 15 years of experience in custom fitting.'
            }
        ];

        await Tailor.insertMany(testTailors);

        res.json({
            success: true,
            message: 'Test tailors created successfully',
            count: testTailors.length
        });
    } catch (error) {
        console.error('Error creating test tailors:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create test tailors',
            error: error.message
        });
    }
});

module.exports = router;
