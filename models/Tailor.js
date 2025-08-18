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
    required: true,
    min: [1, 'Experience must be at least 1 year'],
    max: [50, 'Experience cannot exceed 50 years'],
    validate: {
      validator: function(value) {
        return Number.isInteger(value);
      },
      message: 'Experience must be a whole number'
    }
  },
  specialization: {
    type: [String],
    required: true,
    validate: {
      validator: function(specializations) {
        const validClothingTypes = [
          'Suits',
          'Dresses',
          'Shirts',
          'Pants',
          'Skirts',
          'Blazers',
          'Evening Gowns',
          'Wedding Dresses',
          'Business Attire',
          'Casual Wear',
          'Formal Wear',
          'Alterations'
        ];
        return specializations.every(item => validClothingTypes.includes(item));
      },
      message: 'Invalid clothing type specified'
    }
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

// Generate random experience years if not provided
tailorSchema.pre('save', function(next) {
  if (!this.experience || this.experience === 0) {
    // Generate random experience between 3 and 20 years
    this.experience = Math.floor(Math.random() * (20 - 3 + 1)) + 3;
  }
  next();
});

// Ensure specializations are in proper format
tailorSchema.pre('save', function(next) {
  if (this.specialization) {
    this.specialization = this.specialization.map(item => {
      // Capitalize first letter of each word
      return item.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
    });
  }
  next();
});

module.exports = mongoose.model('Tailor', tailorSchema);