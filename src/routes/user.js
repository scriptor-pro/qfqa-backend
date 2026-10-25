const express = require('express');
const router = express.Router();

const User = require('../models/User');
const ScheduleElement = require('../models/ScheduleElement');
const EnergyLog = require('../models/EnergyLog');
const { requireAuth } = require('../middleware/auth');
const { validateStatsQuery } = require('../middleware/validation');

// Import memory database for fallback
const memoryDB = require('../utils/memory-db');

// Check if we're using memory database (no MongoDB available)
const useMemoryDB = process.env.NODE_ENV === 'development';

// Récupération du profil utilisateur
router.get('/profile', requireAuth, async (req, res) => {
  try {
    let user;
    if (useMemoryDB) {
      user = await memoryDB.findUserById(req.userId);
      // Remove password from memory DB user
      if (user) {
        const { password, ...userWithoutPassword } = user;
        user = userWithoutPassword;
      }
    } else {
      user = await User.findById(req.userId).select('-password');
    }
    
    if (!user) {
      return res.status(404).json({
        error: 'Utilisateur non trouvé'
      });
    }

    // Calculer des statistiques de base
    const totalElements = await ScheduleElement.countDocuments({ userId: req.userId });
    const completedElements = await ScheduleElement.countDocuments({ 
      userId: req.userId, 
      isCompleted: true 
    });
    
    const recentEnergyLog = await EnergyLog.findOne({ userId: req.userId })
      .sort({ timestamp: -1 });
    
    const userProfile = {
      id: user._id,
      username: user.username,
      email: user.email,
      preferences: user.preferences,
      settings: user.settings,
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin,
      stats: {
        tasksTotal: totalElements,
        tasksCompleted: completedElements,
        completionRate: totalElements > 0 ? Math.round((completedElements / totalElements) * 100) : 0,
        currentEnergyLevel: recentEnergyLog ? recentEnergyLog.level : null,
        lastEnergyUpdate: recentEnergyLog ? recentEnergyLog.timestamp : null
      }
    };
    
    res.json({
      success: true,
      user: userProfile
    });
    
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération du profil'
    });
  }
});

// Mise à jour du profil
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const updates = req.body;
    
    // Champs autorisés pour la mise à jour
    const allowedFields = ['preferences', 'settings'];
    const filteredUpdates = {};
    
    for (const field of allowedFields) {
      if (updates[field]) {
        filteredUpdates[field] = updates[field];
      }
    }
    
    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({
        error: 'Aucune donnée valide à mettre à jour'
      });
    }
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: filteredUpdates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        error: 'Utilisateur non trouvé'
      });
    }
    
    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        preferences: user.preferences,
        settings: user.settings,
        updatedAt: user.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: 'Erreur lors de la mise à jour du profil'
    });
  }
});

// Récupération des statistiques
router.get('/stats', requireAuth, validateStatsQuery, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Calculer la date de début selon la période
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(now.getDate() - 30);
        break;
    }
    
    // Statistiques des tâches
    const taskStats = await ScheduleElement.aggregate([
      {
        $match: {
          userId: req.userId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ["$isCompleted", true] }, 1, 0] }
          },
          averageEnergyRequired: { $avg: "$energyRequired" },
          tasksByCategory: {
            $push: {
              category: "$category",
              completed: "$isCompleted"
            }
          }
        }
      }
    ]);
    
    // Statistiques d'énergie
    const energyStats = await EnergyLog.aggregate([
      {
        $match: {
          userId: req.userId,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          averageEnergy: { $avg: "$level" },
          minEnergy: { $min: "$level" },
          maxEnergy: { $max: "$level" },
          totalLogs: { $sum: 1 }
        }
      }
    ]);
    
    // Analyser les catégories
    const categories = {};
    if (taskStats.length > 0 && taskStats[0].tasksByCategory) {
      taskStats[0].tasksByCategory.forEach(task => {
        if (!categories[task.category]) {
          categories[task.category] = { total: 0, completed: 0 };
        }
        categories[task.category].total++;
        if (task.completed) {
          categories[task.category].completed++;
        }
      });
    }
    
    const stats = {
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString()
      },
      tasks: taskStats.length > 0 ? {
        total: taskStats[0].totalTasks,
        completed: taskStats[0].completedTasks,
        completionRate: taskStats[0].totalTasks > 0 
          ? Math.round((taskStats[0].completedTasks / taskStats[0].totalTasks) * 100) 
          : 0,
        averageEnergyRequired: taskStats[0].averageEnergyRequired 
          ? Math.round(taskStats[0].averageEnergyRequired * 10) / 10 
          : null
      } : {
        total: 0,
        completed: 0,
        completionRate: 0,
        averageEnergyRequired: null
      },
      energy: energyStats.length > 0 ? {
        average: Math.round(energyStats[0].averageEnergy * 10) / 10,
        min: energyStats[0].minEnergy,
        max: energyStats[0].maxEnergy,
        totalLogs: energyStats[0].totalLogs
      } : null,
      categories
    };
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des statistiques'
    });
  }
});

// Configuration initiale (onboarding)
router.post('/setup', requireAuth, async (req, res) => {
  try {
    const { preferences, workingHours, goals } = req.body;
    
    if (!preferences && !workingHours) {
      return res.status(400).json({
        error: 'Au moins des préférences ou des horaires de travail sont requis'
      });
    }
    
    const updateData = {};
    
    if (preferences) {
      updateData['preferences'] = { ...preferences };
    }
    
    if (workingHours) {
      updateData['settings.workingHours'] = workingHours;
    }
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        error: 'Utilisateur non trouvé'
      });
    }
    
    // Créer les tâches initiales si des objectifs sont fournis
    if (goals && Array.isArray(goals)) {
      const initialTasks = goals.map(goal => ({
        userId: req.userId,
        title: goal.title || goal,
        type: 'floating',
        duration: goal.duration || 60,
        energyRequired: goal.energyRequired || 3,
        category: goal.category || 'personnel',
        priority: goal.priority || 'medium'
      }));
      
      await ScheduleElement.insertMany(initialTasks);
    }
    
    res.json({
      success: true,
      message: 'Configuration initiale terminée',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        preferences: user.preferences,
        settings: user.settings
      }
    });
    
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({
      error: 'Erreur lors de la configuration initiale'
    });
  }
});

// Suppression du compte
router.delete('/account', requireAuth, async (req, res) => {
  try {
    const { password, confirmation } = req.body;
    
    if (!password || confirmation !== 'DELETE') {
      return res.status(400).json({
        error: 'Mot de passe et confirmation "DELETE" requis'
      });
    }
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        error: 'Utilisateur non trouvé'
      });
    }
    
    // Vérifier le mot de passe
    const { comparePassword } = require('../utils/password');
    const isPasswordValid = await comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Mot de passe incorrect'
      });
    }
    
    // Supprimer toutes les données associées
    await Promise.all([
      User.findByIdAndDelete(req.userId),
      ScheduleElement.deleteMany({ userId: req.userId }),
      EnergyLog.deleteMany({ userId: req.userId })
    ]);
    
    res.json({
      success: true,
      message: 'Compte et toutes les données associées supprimés avec succès'
    });
    
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({
      error: 'Erreur lors de la suppression du compte'
    });
  }
});

module.exports = router;