const Tailor = require('../models/Tailor');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads/profiles');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `tailor-profile-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            return cb(null, true);
        }
        cb(new Error('Please upload an image file'), false);
    }
}).single('profilePicture');

exports.getTailorProfile = async (req, res) => {
    try {
        const tailor = await Tailor.findById(req.user.id)
            .select('-password');

        if (!tailor) {
            return res.status(404).json({
                status: 'error',
                message: 'Tailor not found'
            });
        }

        const profileData = {
            status: 'success',
            data: {
                tailor: {
                    id: tailor._id,
                    name: tailor.name,
                    email: tailor.email,
                    phoneNumber: tailor.phoneNumber || '',
                    shopName: tailor.shopName || '',
                    shopAddress: tailor.shopAddress || {},
                    businessHours: tailor.businessHours || {},
                    experience: tailor.experience,
                    specialization: tailor.specialization,
                    profilePicture: tailor.profilePicture,
                    bio: tailor.bio || '',
                    isVerified: tailor.isVerified,
                    isApproved: tailor.isApproved,
                    createdAt: tailor.createdAt,
                    memberSince: new Date(tailor.createdAt).toLocaleDateString()
                }
            }
        };

        res.json(profileData);

    } catch (error) {
        console.error('Tailor profile fetch error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to load tailor profile',
            error: error.message
        });
    }
};

exports.updateTailorProfile = async (req, res) => {
    try {
        const allowedUpdates = [
            'name',
            'phoneNumber',
            'shopName',
            'shopAddress',
            'businessHours',
            'experience',
            'specialization',
            'bio'
        ];
        
        const updates = {};

        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                if (key === 'shopAddress' && typeof req.body[key] === 'object') {
                    updates[key] = {
                        street: req.body[key].street || '',
                        city: req.body[key].city || '',
                        state: req.body[key].state || '',
                        postalCode: req.body[key].postalCode || ''
                    };
                } else if (key === 'businessHours' && typeof req.body[key] === 'object') {
                    updates[key] = {
                        start: req.body[key].start || '',
                        end: req.body[key].end || '',
                        daysOpen: req.body[key].daysOpen || []
                    };
                } else if (req.body[key]) {
                    updates[key] = req.body[key];
                }
            }
        });

        const tailor = await Tailor.findByIdAndUpdate(
            req.user.id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        if (!tailor) {
            return res.status(404).json({
                status: 'error',
                message: 'Tailor not found'
            });
        }

        res.json({
            status: 'success',
            message: 'Profile updated successfully',
            data: {
                tailor: {
                    id: tailor._id,
                    name: tailor.name,
                    email: tailor.email,
                    phoneNumber: tailor.phoneNumber,
                    shopName: tailor.shopName,
                    shopAddress: tailor.shopAddress,
                    businessHours: tailor.businessHours,
                    experience: tailor.experience,
                    specialization: tailor.specialization,
                    profilePicture: tailor.profilePicture,
                    bio: tailor.bio,
                    isVerified: tailor.isVerified,
                    isApproved: tailor.isApproved
                }
            }
        });
    } catch (error) {
        console.error('Tailor profile update error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update tailor profile',
            error: error.message
        });
    }
};

exports.updateTailorProfileImage = async (req, res) => {
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
                return res.status(400).json({
                    status: 'error',
                    message: 'No file uploaded'
                });
            }
            
            const imageUrl = `/uploads/profiles/${path.basename(req.file.path)}`;

            // Delete old profile picture if it exists
            const oldTailor = await Tailor.findById(req.user.id);
            if (oldTailor && oldTailor.profilePicture) {
                const oldPath = path.join(__dirname, '..', oldTailor.profilePicture);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
            
            const tailor = await Tailor.findByIdAndUpdate(
                req.user.id,
                { profilePicture: imageUrl },
                { new: true }
            ).select('-password');

            if (!tailor) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Tailor not found'
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
