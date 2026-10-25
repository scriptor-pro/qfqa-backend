const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
    match: /^[a-zA-Z0-9_-]+$/
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    energyTracking: {
      type: Boolean,
      default: true
    },
    notifications: {
      schedule: { type: Boolean, default: true },
      breaks: { type: Boolean, default: true },
      lowEnergy: { type: Boolean, default: false }
    },
    accessibility: {
      reduceMotion: { type: Boolean, default: false },
      highContrast: { type: Boolean, default: false },
      fontSize: {
        type: String,
        enum: ['small', 'medium', 'large'],
        default: 'medium'
      }
    }
  },
  settings: {
    workingHours: {
      start: {
        type: String,
        default: '09:00',
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      },
      end: {
        type: String,
        default: '17:00',
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      }
    },
    breakReminders: {
      type: Number,
      default: 60,
      min: 15,
      max: 240
    },
    energyCheckFrequency: {
      type: Number,
      default: 120,
      min: 30,
      max: 480
    }
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

// Virtual for user stats
userSchema.virtual('stats', {
  ref: 'UserStats',
  localField: '_id',
  foreignField: 'userId',
  justOne: true
});

module.exports = mongoose.model('User', userSchema);