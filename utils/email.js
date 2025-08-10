const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter = null;

const initializeTransporter = async () => {
    try {
        transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Verify connection
        await transporter.verify();
        console.log('✅ Gmail service connected successfully');
        console.log('📧 Using email:', process.env.GMAIL_USER);
        return true;
    } catch (error) {
        console.error('❌ Gmail service setup failed:', error.message);
        return false;
    }
};

exports.sendVerificationEmail = async (email, otp) => {
    try {
        if (!transporter) {
            await initializeTransporter();
        }

        const mailOptions = {
            from: `"TailorCraft" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Email Verification - TailorCraft',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
                    <h2 style="color: #333; text-align: center;">Welcome to TailorCraft!</h2>
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; text-align: center;">
                        <p style="margin: 0;">Your verification code is:</p>
                        <h1 style="color: #007bff; font-size: 32px; letter-spacing: 2px; margin: 10px 0;">${otp}</h1>
                        <p style="color: #666; margin: 0;">This code will expire in 10 minutes</p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('📧 Verification email sent to:', email);
        return true;
    } catch (error) {
        console.error('❌ Error sending verification email:', error.message);
        throw error;
    }
};

exports.generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Initialize email service
initializeTransporter();