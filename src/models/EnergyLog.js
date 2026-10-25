const mongoose = require('mongoose');

const energyLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  context: {
    type: String,
    enum: ['manual', 'scheduled_check', 'after_task', 'break_time'],
    default: 'manual'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
energyLogSchema.index({ userId: 1, timestamp: -1 });

// Static method to get current energy level
energyLogSchema.statics.getCurrentEnergy = function(userId) {
  return this.findOne({ userId }).sort({ timestamp: -1 });
};

// Static method to get energy trends
energyLogSchema.statics.getEnergyTrend = function(userId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    userId,
    timestamp: { $gte: startDate }
  }).sort({ timestamp: 1 });
};

module.exports = mongoose.model('EnergyLog', energyLogSchema);