const multer = require('multer');
const path = require('path');

// Configure storage based on environment
const storage = process.env.NODE_ENV === 'production' 
    ? multer.memoryStorage() // Use memory storage for cloud uploads in production
    : multer.diskStorage({   // Use disk storage for development
        destination: function(req, file, cb) {
            cb(null, 'uploads/profiles/');
        },
        filename: function(req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
        }
    });

// File filter
const fileFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

// Configure upload
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    },
    fileFilter: fileFilter
});

// Helper function to generate unique filename
const generateUniqueFilename = (originalname) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    return 'profile-' + uniqueSuffix + path.extname(originalname);
};

// Cloud upload helper (placeholder for cloud storage implementation)
const uploadToCloud = async (buffer, filename, mimetype) => {
    // In production, implement cloud storage upload here
    // For now, return a placeholder URL
    if (process.env.NODE_ENV === 'production') {
        // TODO: Implement actual cloud storage upload
        // Examples: Cloudinary, AWS S3, etc.
        console.warn('Cloud storage not implemented. File upload will fail in production.');
        return null;
    }
    return `/uploads/profiles/${filename}`;
};

module.exports = {
    upload,
    generateUniqueFilename,
    uploadToCloud
};
