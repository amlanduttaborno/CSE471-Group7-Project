const User = require('../models/User');
const { logActivity } = require('./activityController');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendVerificationEmail, generateOTP, sendPasswordResetEmail } = require('../utils/email');
const crypto = require('crypto');

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'No user found with this email address'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // Save hashed token to user
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
        user.resetAttempts = 0; // Reset the attempts counter
        await user.save();

        // Create reset URL
        const resetURL = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;
        
        // Send email
        await sendPasswordResetEmail(user.email, resetURL);

        res.json({
            status: 'success',
            message: 'Password reset link sent to email'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error sending password reset email'
        });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        // Hash the token from the URL to compare with stored token
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find user by token
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid or expired reset token'
            });
        }

        // Check attempt limit (e.g., 5 attempts)
        if (user.resetAttempts >= 5) {
            return res.status(400).json({
                status: 'error',
                message: 'Too many reset attempts. Please request a new reset link.'
            });
        }

        // Update password
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        user.resetAttempts = 0;
        await user.save();

        res.json({
            status: 'success',
            message: 'Password reset successful'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error resetting password'
        });
    }
};

exports.register = async (req, res) => {
    try {
        console.log('Registration request received:', req.body);
        const { fullName, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                status: 'error',
                message: 'Email already registered'
            });
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Hash password before creating user
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create new user
        const user = await User.create({
            name: fullName,
            email,
            password: hashedPassword,
            otp: {
                code: otp,
                expiresAt: otpExpires
            },
            isVerified: false
        });

        // Send verification email
        await sendVerificationEmail(email, otp);

        // Generate token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '10m' }
        );

        res.status(201).json({
            status: 'success',
            message: 'Registration successful. Please check your email for verification code.',
            data: {
                token,
                requiresVerification: true
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Registration failed'
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid email or password'
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid email or password'
            });
        }

        // Check if email is verified
        if (!user.isVerified) {
            // Generate new OTP
            const otp = generateOTP();
            const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
            
            user.otp = {
                code: otp,
                expiresAt: otpExpires
            };
            await user.save();

            // Send new verification email
            await sendVerificationEmail(email, otp);

            // Generate temporary token
            const tempToken = jwt.sign(
                { id: user._id },
                process.env.JWT_SECRET,
                { expiresIn: '10m' }
            );

            return res.status(403).json({
                status: 'error',
                message: 'Email not verified. A new verification code has been sent to your email.',
                data: {
                    token: tempToken,
                    requiresVerification: true
                }
            });
        }

        // Generate token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            status: 'success',
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    isVerified: user.isVerified
                }
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Login failed'
        });
    }
};

exports.verifyEmail = async (req, res) => {
    try {
        console.log('Email verification request received:', req.body);
        console.log('Authorization header:', req.headers.authorization);
        const { otp } = req.body;
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'No token provided'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        // Check if OTP exists and is valid
        if (!user.otp || !user.otp.code || !user.otp.expiresAt) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid or expired OTP. Please request a new one.'
            });
        }

        // Check if OTP is expired
        if (Date.now() > user.otp.expiresAt) {
            return res.status(400).json({
                status: 'error',
                message: 'OTP has expired. Please request a new one.'
            });
        }

        // Verify OTP
        if (user.otp.code !== otp) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid verification code'
            });
        }

        // Mark user as verified
        user.isVerified = true;
        user.otp = undefined; // Clear OTP after successful verification
        await user.save();

        // Log account creation activity
        try {
            await logActivity.accountCreated(user._id);
        } catch (activityError) {
            console.error('Failed to log account creation activity:', activityError);
            // Don't fail the request if activity logging fails
        }

        // Generate new token with longer expiry
        const newToken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            status: 'success',
            message: 'Email verified successfully',
            data: {
                token: newToken,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    isVerified: user.isVerified
                }
            }
        });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Verification failed'
        });
    }
};

exports.resendOTP = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'No token provided'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        // Generate new OTP
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

        user.otp = {
            code: otp,
            expiresAt: otpExpires
        };
        await user.save();

        // Send new verification email
        await sendVerificationEmail(user.email, otp);

        // Generate new temporary token
        const newToken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '10m' }
        );

        res.json({
            status: 'success',
            message: 'New verification code sent successfully',
            data: {
                token: newToken
            }
        });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to resend verification code'
        });
    }
};