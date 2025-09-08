const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  isAdmin: {
    type: Boolean,
    default: false
  },
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
  phoneNumber: {
    type: String,
    trim: true
  },
  address: {
    street: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    postalCode: {
      type: String,
      trim: true
    }
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    validate: {
      validator: function(password) {
        // Only validate password when it's being modified
        if (this.isModified('password')) {
          const { isValid } = require('../utils/validation').validatePassword(password);
          return isValid;
        }
        return true;
      },
      message: 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character'
    }
  },
  address: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profilePicture: {
    type: String,
    default: ''
  },
  dateOfBirth: {
    type: Date
  },
  bio: {
    type: String,
    trim: true,
    maxLength: [500, 'Bio cannot be more than 500 characters']
  },
  measurements: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Measurement'
  },
  otp: {
    code: String,
    expiresAt: Date
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  resetAttempts: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema, 'Users');