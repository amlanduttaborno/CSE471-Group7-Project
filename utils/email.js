const nodemailer = require('nodemailer');

let transporter;

try {
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    },
    debug: process.env.NODE_ENV === 'development'
  });

  // Verify the transporter
  transporter.verify(function (error, success) {
    if (error) {
      console.error('❌ Email service error:', error);
    } else {
      console.log('✅ Email service is ready');
    }
  });
} catch (error) {
  console.error('❌ Email transporter creation failed:', error);
}

// Verify transporter
transporter.verify((error, success) => {
  if (error) {
    console.error('Email service error:', error);
  } else {
    console.log('Email service is ready');
  }
});

exports.sendVerificationEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Email Verification',
    html: `
      <h1>Email Verification</h1>
      <p>Your verification code is: <strong>${otp}</strong></p>
      <p>This code will expire in 10 minutes.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

exports.generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
