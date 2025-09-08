const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendPasswordResetEmail } = require('../utils/email');
const crypto = require('crypto');

// Generate reset token and send email
exports.forgotPassword = async (req, res) => {
    try {
        console.log('Received forgot password request for:', req.body.email);
        const { email, userType } = req.body;

        if (!email) {
            return res.status(400).json({
                status: 'error',
                message: 'Email is required'
            });
        }

        let user;
        if (userType === 'tailor') {
            user = await Tailor.findOne({ email });
        } else {
            user = await User.findOne({ email });
        }

        if (!user) {
            console.log('No user found with email:', email);
            return res.status(404).json({
                status: 'error',
                message: 'If a user exists with this email, they will receive a password reset link.'
            });
        }

        const userTypeParam = userType === 'tailor' ? 'tailor' : 'user';

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

        // Save reset token to user
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpires;
        await user.save();

        // Create reset URL
        const resetURL = `${process.env.BASE_URL}/reset-password?token=${resetToken}&type=${userTypeParam}`;
        
        // Send email
        await sendPasswordResetEmail(user.email, resetURL);
        console.log('Password reset email sent successfully to:', email);

        res.status(200).json({
            status: 'success',
            message: 'If a user exists with this email, they will receive a password reset link.'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error sending password reset email'
        });
    }
};

// Reset password with token
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // Validate password
        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({
                status: 'error',
                message: 'Password must be at least 8 characters long'
            });
        }

        // Password validation regex
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?:{}|<>])[A-Za-z\d!@#$%^&*(),.?:{}|<>]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({
                status: 'error',
                message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
            });
        }

        // Find user with valid reset token
        const user = await User.findOne({
            resetPasswordToken: token
        });

        console.log('User search result:', {
            found: !!user,
            tokenMatches: user ? user.resetPasswordToken === token : false,
            tokenExpired: user ? user.resetPasswordExpires < Date.now() : null,
            userId: user ? user._id : null
        });

        if (!user) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid reset token'
            });
        }

        if (!user.resetPasswordExpires || user.resetPasswordExpires < Date.now()) {
            return res.status(400).json({
                status: 'error',
                message: 'Reset token has expired'
            });
        }

        // Update password
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({
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
