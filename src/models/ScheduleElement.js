const mongoose = require('mongoose');

const scheduleElementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    required: true,
    enum: ['fixed', 'floating']
  },
  // For fixed elements
  startTime: {
    type: String,
    validate: {
      validator: function(v) {
        return this.type !== 'fixed' || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Format d\'heure invalide (HH:MM)'
    }
  },
  endTime: {
    type: String,
    validate: {
      validator: function(v) {
        return this.type !== 'fixed' || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Format d\'heure invalide (HH:MM)'
    }
  },
  // For floating elements
  duration: {
    type: Number,
    validate: {
      validator: function(v) {
        return this.type !== 'floating' || (v && v > 0);
      },
      message: 'Durée requise pour les éléments flottants'
    }
  },
  energyRequired: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    default: 3
  },
  category: {
    type: String,
    required: true,
    enum: ['travail', 'personnel', 'santé', 'routine', 'loisir', 'social', 'apprentissage', 'autre'],
    default: 'autre'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  // For tracking completion
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  // For recurring elements
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrencePattern: {
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly']
    },
    days: [Number], // 0-6 for weekly, 1-31 for monthly
    endDate: Date
  },
  // For moved floating elements
  scheduledFor: {
    date: String, // YYYY-MM-DD
    timeSlot: String // HH:MM
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  color: {
    type: String,
    match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
    default: '#3B82F6'
  }
}, {
  timestamps: true
});

// Indexes for performance
scheduleElementSchema.index({ userId: 1, type: 1 });
scheduleElementSchema.index({ userId: 1, 'scheduledFor.date': 1 });
scheduleElementSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('ScheduleElement', scheduleElementSchema);