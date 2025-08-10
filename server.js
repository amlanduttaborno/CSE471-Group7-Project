require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Import routes
const userRoutes = require('./src/routes/userRoutes');
const tailorRoutes = require('./src/routes/tailorRoutes');
const authRoutes = require('./src/routes/authRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const profileRoutes = require('./src/routes/profileRoutes');

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/tailors', tailorRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/profile', profileRoutes);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/customer-auth', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'customer-auth.html'));
});

app.get('/tailor-auth', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'tailor-auth.html'));
});

// MongoDB Connection with detailed error logging
mongoose.set('debug', true);
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
})
.then(() => {
    console.log('Successfully connected to MongoDB.');
})
.catch((err) => {
    console.error('MongoDB connection error:', err);
    console.error('MongoDB URI:', process.env.MONGODB_URI);
    process.exit(1);
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

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'An error occurred',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

const PORT = process.env.PORT || 1250;
const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Handle server errors
server.on('error', (err) => {
    console.error('Server error:', err);
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});