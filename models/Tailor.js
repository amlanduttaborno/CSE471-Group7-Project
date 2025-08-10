const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const tailorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    validate: {
      validator: function(password) {
        if (this.isModified('password')) {
          const { isValid } = require('../utils/validation').validatePassword(password);
          return isValid;
        }
        return true;
      },
      message: 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character'
    }
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  experience: {
    type: Number,
    required: true
  },
  specialization: {
    type: [String],
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Hash password before saving
tailorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to check password
tailorSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Tailor', tailorSchema);