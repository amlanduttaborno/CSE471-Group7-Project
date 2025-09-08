require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Note: File uploads are handled via cloud storage in production
// Local uploads directory is only used in development
if (process.env.NODE_ENV !== 'production') {
    const uploadsDir = path.join(__dirname, 'uploads');
    const profilesDir = path.join(uploadsDir, 'profiles');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
    if (!fs.existsSync(profilesDir)) {
        fs.mkdirSync(profilesDir, { recursive: true });
    }
    // Only serve local uploads in development
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// Static file serving
app.use(express.static(path.join(__dirname, 'public')));

// Import routes
const userRoutes = require('./routes/userRoutes');
const tailorRoutes = require('./routes/tailorRoutes');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const tailorDashboardRoutes = require('./routes/tailorDashboardRoutes');
const profileRoutes = require('./routes/profileRoutes');
const tailorProfileRoutes = require('./routes/tailorProfileRoutes');
const measurementRoutes = require('./routes/measurementRoutes');
const activityRoutes = require('./routes/activityRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const pricingRoutes = require('./routes/pricingRoutes');
const testRoutes = require('./routes/testRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const { forgotPassword, resetPassword } = require('./controllers/passwordResetController');
const adminRoutes = require('./routes/adminRoutes');

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/tailors', tailorRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/tailor-dashboard', tailorDashboardRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/tailor-profile', tailorProfileRoutes);
app.use('/api', measurementRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/test', testRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);

// Password Reset Routes
app.post('/api/auth/forgot-password', forgotPassword);
app.post('/api/auth/reset-password', resetPassword);

// MongoDB Connection optimized for serverless
mongoose.set('debug', process.env.NODE_ENV === 'development');

const connectDB = async () => {
    try {
        if (mongoose.connections[0].readyState) {
            return mongoose.connections[0];
        }
        
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            bufferCommands: false,
            dbName: 'TailorCraft'
        });
        
        console.log('Successfully connected to MongoDB.');
        return conn;
    } catch (err) {
        console.error('MongoDB connection error:', err);
        console.error('MongoDB URI:', process.env.MONGODB_URI ? 'URI is set' : 'URI is not set');
        throw err;
    }
};

// Initialize connection
connectDB().catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
    }
});

// Connection error handling
mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

// Already defined routes above
// Keeping this section empty to avoid duplicates

// Serve HTML files - make sure these routes are after API routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/reset-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'reset-password.html'));
});

app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'customer-dashboard.html'));
});

app.get('/customer-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'customer-dashboard.html'));
});

app.get('/customer-auth.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'customer-auth.html'));
});

app.get('/tailor-auth.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'tailor-auth.html'));
});

app.get('/tailor-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'tailor-dashboard.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'An error occurred',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

const PORT = process.env.PORT || 3000;

// Only start server if not in serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    const server = app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });

    // Handle server errors
    server.on('error', (err) => {
        console.error('Server error:', err);
    });
}

// For Vercel, export the app
module.exports = app;

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    // Don't exit in production/serverless
    if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
    }
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // Don't exit in production/serverless
    if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
    }
});