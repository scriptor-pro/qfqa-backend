const express = require('express');
const router = express.Router();

// Middleware simple d'authentification
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      error: 'Authentication requise'
    });
  }
  
  // TODO: Vérifier le JWT token
  req.userId = 1; // Simulation
  next();
};

// Récupération du profil utilisateur
router.get('/profile', requireAuth, (req, res) => {
  // TODO: Récupérer depuis la base de données
  
  const userProfile = {
    id: req.userId,
    username: 'testuser',
    email: 'test@example.com',
    preferences: {
      theme: 'auto',
      energyTracking: true,
      notifications: {
        schedule: true,
        breaks: true,
        lowEnergy: false
      },
      accessibility: {
        reduceMotion: false,
        highContrast: false,
        fontSize: 'medium'
      }
    },
    settings: {
      workingHours: {
        start: '09:00',
        end: '17:00'
      },
      breakReminders: 60, // minutes
      energyCheckFrequency: 120 // minutes
    },
    stats: {
      tasksCompleted: 42,
      averageEnergyLevel: 3.2,
      streakDays: 5,
      totalHoursPlanned: 127
    }
  };
  
  res.json({
    success: true,
    user: userProfile
  });
});

// Mise à jour du profil
router.put('/profile', requireAuth, (req, res) => {
  const updates = req.body;
  
  // Validation des champs autorisés
  const allowedFields = ['preferences', 'settings'];
  const filteredUpdates = {};
  
  for (const field of allowedFields) {
    if (updates[field]) {
      filteredUpdates[field] = updates[field];
    }
  }
  
  // TODO: Mettre à jour en base de données
  
  console.log(`Profil utilisateur ${req.userId} mis à jour:`, filteredUpdates);
  
  res.json({
    success: true,
    message: 'Profil mis à jour',
    updates: filteredUpdates
  });
});

// Récupération des statistiques
router.get('/stats', requireAuth, (req, res) => {
  const { period } = req.query; // day, week, month
  
  // TODO: Calculer depuis la base de données
  
  // Simulation basée sur la période
  let stats;
  switch (period) {
    case 'day':
      stats = {
        period: 'today',
        tasksCompleted: 3,
        tasksPlanned: 5,
        averageEnergy: 3.5,
        hoursPlanned: 6,
        hoursCompleted: 4.5
      };
      break;
    case 'week':
      stats = {
        period: 'this_week',
        tasksCompleted: 18,
        tasksPlanned: 25,
        averageEnergy: 3.2,
        hoursPlanned: 35,
        hoursCompleted: 28,
        bestDay: 'Tuesday',
        streak: 5
      };
      break;
    default:
      stats = {
        period: 'this_month',
        tasksCompleted: 67,
        tasksPlanned: 89,
        averageEnergy: 3.1,
        hoursPlanned: 142,
        hoursCompleted: 115,
        bestWeek: 2,
        longestStreak: 8
      };
  }
  
  res.json({
    success: true,
    stats
  });
});

// Configuration initiale (onboarding)
router.post('/setup', requireAuth, (req, res) => {
  const { preferences, workingHours, goals } = req.body;
  
  if (!preferences || !workingHours) {
    return res.status(400).json({
      error: 'Préférences et horaires de travail requis'
    });
  }
  
  // TODO: Sauvegarder la configuration initiale
  
  const setupData = {
    userId: req.userId,
    preferences,
    workingHours,
    goals: goals || [],
    completedAt: new Date().toISOString()
  };
  
  console.log('Configuration initiale:', setupData);
  
  res.json({
    success: true,
    message: 'Configuration terminée',
    setup: setupData
  });
});

// Changement de mot de passe
router.post('/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      error: 'Mot de passe actuel et nouveau mot de passe requis'
    });
  }
  
  if (newPassword.length < 8) {
    return res.status(400).json({
      error: 'Le nouveau mot de passe doit contenir au moins 8 caractères'
    });
  }
  
  // TODO: Vérifier l'ancien mot de passe et mettre à jour
  
  console.log(`Mot de passe changé pour l'utilisateur ${req.userId}`);
  
  res.json({
    success: true,
    message: 'Mot de passe mis à jour'
  });
});

// Suppression du compte
router.delete('/account', requireAuth, (req, res) => {
  const { password, confirmation } = req.body;
  
  if (!password || confirmation !== 'DELETE') {
    return res.status(400).json({
      error: 'Mot de passe et confirmation "DELETE" requis'
    });
  }
  
  // TODO: Vérifier le mot de passe et supprimer le compte
  
  console.log(`Compte utilisateur ${req.userId} supprimé`);
  
  res.json({
    success: true,
    message: 'Compte supprimé'
  });
});

module.exports = router;