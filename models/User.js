const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    required: function() {
      return !this.oauth_id; // Email is required unless using OAuth
    }
  },
  phone: {
    type: String,
    trim: true
  },
  password_hash: {
    type: String,
    required: function() {
      return !this.oauth_id; // Password required unless using OAuth
    }
  },
  oauth_provider: {
    type: String,
    enum: ['google', 'facebook', 'github'],
    default: null
  },
  oauth_id: {
    type: String,
    default: null
  },
  user_type: {
    type: String,
    enum: ['student', 'teacher', 'admin', 'lab_assistant'],
    default: 'student',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  profile_picture: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  interests: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  }
}, {
  timestamps: true // Automatically creates created_at and updated_at
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password_hash')) return next(); // Added missing parenthesis
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
    next();
  } catch (err) {
    next(err);
  }
});
// Method to compare passwords
userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password_hash);
};

module.exports = mongoose.model('User', userSchema);