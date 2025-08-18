const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads/profiles');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `profile-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        // Accept all image types
        if (file.mimetype.startsWith('image/')) {
            return cb(null, true);
        }
        cb(new Error('Please upload an image file'), false);
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
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update profile',
            error: error.message
        });
    }
};

// Dedicated handler for profile image upload
exports.updateProfileImage = async (req, res) => {
    console.log('Profile image upload request received');
    try {
        upload(req, res, async (err) => {
            if (err) {
                console.error('Upload error:', err);
                return res.status(400).json({
                    status: 'error',
                    message: err.message
                });
            }

            if (!req.file) {
                console.error('No file in request');
                return res.status(400).json({
                    status: 'error',
                    message: 'No file uploaded'
                });
            }

            console.log('File uploaded successfully:', req.file);
            
            // Construct the URL that will be accessible from the frontend
            const imageUrl = `/uploads/profiles/${path.basename(req.file.path)}`;
            console.log('Image URL:', imageUrl);

            // Delete old profile picture if it exists
            const oldUser = await User.findById(req.user.id);
            if (oldUser && oldUser.profilePicture) {
                const oldPath = path.join(__dirname, '..', oldUser.profilePicture);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
            
            const user = await User.findByIdAndUpdate(
                req.user.id,
                { profilePicture: imageUrl },
                { new: true }
            ).select('-password -otp');

            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    message: 'User not found'
                });
            }

            res.json({
                status: 'success',
                message: 'Profile image updated successfully',
                imageUrl: imageUrl
            });
        });
    } catch (error) {
        console.error('Profile image upload error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to upload profile image',
            error: error.message
        });
    }
};