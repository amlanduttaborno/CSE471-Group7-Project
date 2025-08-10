const User = require('../models/User');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: 'uploads/profiles/',
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `profile-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('Only .jpeg, .jpg and .png format allowed!'), false);
        }
        cb(null, true);
    }
}).single('profilePicture');

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password -otp');

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        // Format the data for frontend
        const profileData = {
            status: 'success',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone || '',
                    address: user.address || '',
                    profilePicture: user.profilePicture,
                    bio: user.bio || '',
                    dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString().split('T')[0] : '',
                    isVerified: user.isVerified,
                    createdAt: user.createdAt,
                    memberSince: new Date(user.createdAt).toLocaleDateString(),
                    status: user.isActive ? 'Active' : 'Inactive'
                },
                stats: {
                    totalOrders: 0, // Will be implemented with orders system
                    completedOrders: 0,
                    pendingOrders: 0
                }
            }
        };

        res.json(profileData);

    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to load profile',
            error: error.message
        });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        upload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({
                    status: 'error',
                    message: err.message
                });
            }

            const allowedUpdates = ['name', 'phone', 'address', 'bio', 'dateOfBirth'];
            const updates = {};

            // Filter only allowed fields
            Object.keys(req.body).forEach(key => {
                if (allowedUpdates.includes(key)) {
                    if (key === 'dateOfBirth' && req.body[key]) {
                        updates[key] = new Date(req.body[key]);
                    } else if (req.body[key]) {
                        updates[key] = req.body[key];
                    }
                }
            });

            // Add profile picture if uploaded
            if (req.file) {
                updates.profilePicture = `/uploads/profiles/${req.file.filename}`;
            }

            const user = await User.findByIdAndUpdate(
                req.user.id,
                updates,
                { new: true, runValidators: true }
            ).select('-password -otp');

            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    message: 'User not found'
                });
            }

            res.json({
                status: 'success',
                message: 'Profile updated successfully',
                data: {
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone || '',
                        address: user.address || '',
                        profilePicture: user.profilePicture,
                        isVerified: user.isVerified,
                        memberSince: new Date(user.createdAt).toLocaleDateString(),
                        status: user.isActive ? 'Active' : 'Inactive'
                    }
                }
            });
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update profile',
            error: error.message
        });
    }
};