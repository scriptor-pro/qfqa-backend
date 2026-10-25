const express = require('express');
const router = express.Router();

const ScheduleElement = require('../models/ScheduleElement');
const EnergyLog = require('../models/EnergyLog');
const { requireAuth } = require('../middleware/auth');
const { 
  validateScheduleElement, 
  validateEnergyUpdate, 
  validateObjectId 
} = require('../middleware/validation');

// Récupération des éléments de planning
router.get('/elements', requireAuth, async (req, res) => {
  try {
    const { date, type } = req.query;
    
    const filter = { userId: req.userId };
    
    if (type && ['fixed', 'floating'].includes(type)) {
      filter.type = type;
    }
    
    if (date) {
      // Pour les éléments programmés à une date spécifique
      filter['scheduledFor.date'] = date;
    }
    
    const elements = await ScheduleElement.find(filter)
      .sort({ 
        type: 1, // Fixed elements first
        startTime: 1, // Then by start time
        priority: -1, // Then by priority
        createdAt: 1 
      });
    
    res.json({
      success: true,
      elements: elements.map(element => ({
        id: element._id,
        title: element.title,
        description: element.description,
        type: element.type,
        startTime: element.startTime,
        endTime: element.endTime,
        duration: element.duration,
        energyRequired: element.energyRequired,
        category: element.category,
        priority: element.priority,
        isCompleted: element.isCompleted,
        completedAt: element.completedAt,
        scheduledFor: element.scheduledFor,
        tags: element.tags,
        color: element.color,
        createdAt: element.createdAt
      }))
    });
    
  } catch (error) {
    console.error('Schedule elements fetch error:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des éléments de planning'
    });
  }
});

// Ajout d'un élément de planning
router.post('/elements', requireAuth, validateScheduleElement, async (req, res) => {
  try {
    const elementData = {
      ...req.body,
      userId: req.userId
    };
    
    const element = new ScheduleElement(elementData);
    await element.save();
    
    res.status(201).json({
      success: true,
      message: 'Élément ajouté avec succès',
      element: {
        id: element._id,
        title: element.title,
        type: element.type,
        startTime: element.startTime,
        endTime: element.endTime,
        duration: element.duration,
        energyRequired: element.energyRequired,
        category: element.category,
        priority: element.priority,
        createdAt: element.createdAt
      }
    });
    
  } catch (error) {
    console.error('Schedule element creation error:', error);
    res.status(500).json({
      error: 'Erreur lors de la création de l\'élément'
    });
  }
});

// Modification d'un élément
router.put('/elements/:id', requireAuth, validateObjectId, validateScheduleElement, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const element = await ScheduleElement.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { $set: updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!element) {
      return res.status(404).json({
        error: 'Élément non trouvé'
      });
    }
    
    res.json({
      success: true,
      message: 'Élément mis à jour avec succès',
      element: {
        id: element._id,
        title: element.title,
        type: element.type,
        startTime: element.startTime,
        endTime: element.endTime,
        duration: element.duration,
        energyRequired: element.energyRequired,
        category: element.category,
        priority: element.priority,
        updatedAt: element.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Schedule element update error:', error);
    res.status(500).json({
      error: 'Erreur lors de la mise à jour de l\'élément'
    });
  }
});

// Suppression d'un élément
router.delete('/elements/:id', requireAuth, validateObjectId, async (req, res) => {
  try {
    const { id } = req.params;
    
    const element = await ScheduleElement.findOneAndDelete({
      _id: id,
      userId: req.userId
    });
    
    if (!element) {
      return res.status(404).json({
        error: 'Élément non trouvé'
      });
    }
    
    res.json({
      success: true,
      message: 'Élément supprimé avec succès'
    });
    
  } catch (error) {
    console.error('Schedule element deletion error:', error);
    res.status(500).json({
      error: 'Erreur lors de la suppression de l\'élément'
    });
  }
});

// Déplacement d'un élément flottant vers un créneau
router.post('/elements/:id/move', requireAuth, validateObjectId, async (req, res) => {
  try {
    const { id } = req.params;
    const { timeSlot, date } = req.body;
    
    if (!timeSlot || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeSlot)) {
      return res.status(400).json({
        error: 'Créneau horaire valide requis (HH:MM)'
      });
    }
    
    const element = await ScheduleElement.findOneAndUpdate(
      { 
        _id: id, 
        userId: req.userId,
        type: 'floating'
      },
      {
        $set: {
          'scheduledFor.timeSlot': timeSlot,
          'scheduledFor.date': date || new Date().toISOString().split('T')[0],
          updatedAt: new Date()
        }
      },
      { new: true }
    );
    
    if (!element) {
      return res.status(404).json({
        error: 'Élément flottant non trouvé'
      });
    }
    
    res.json({
      success: true,
      message: 'Élément déplacé avec succès',
      placement: {
        elementId: element._id,
        timeSlot: element.scheduledFor.timeSlot,
        date: element.scheduledFor.date
      }
    });
    
  } catch (error) {
    console.error('Schedule element move error:', error);
    res.status(500).json({
      error: 'Erreur lors du déplacement de l\'élément'
    });
  }
});

// Marquer un élément comme complété/incomplet
router.post('/elements/:id/toggle', requireAuth, validateObjectId, async (req, res) => {
  try {
    const { id } = req.params;
    
    const element = await ScheduleElement.findOne({
      _id: id,
      userId: req.userId
    });
    
    if (!element) {
      return res.status(404).json({
        error: 'Élément non trouvé'
      });
    }
    
    element.isCompleted = !element.isCompleted;
    element.completedAt = element.isCompleted ? new Date() : null;
    
    await element.save();
    
    res.json({
      success: true,
      message: element.isCompleted ? 'Élément marqué comme terminé' : 'Élément marqué comme non terminé',
      element: {
        id: element._id,
        isCompleted: element.isCompleted,
        completedAt: element.completedAt
      }
    });
    
  } catch (error) {
    console.error('Toggle element error:', error);
    res.status(500).json({
      error: 'Erreur lors de la modification du statut'
    });
  }
});

// Récupération du niveau d'énergie actuel
router.get('/energy', requireAuth, async (req, res) => {
  try {
    const currentEnergyLog = await EnergyLog.getCurrentEnergy(req.userId);
    
    if (!currentEnergyLog) {
      return res.json({
        success: true,
        energy: {
          current: null,
          max: 5,
          lastUpdated: null,
          suggestion: 'Veuillez indiquer votre niveau d\'énergie actuel'
        }
      });
    }
    
    const now = new Date();
    const hoursSinceUpdate = (now - currentEnergyLog.timestamp) / (1000 * 60 * 60);
    
    // Suggérer une mise à jour si le dernier log date de plus de 4 heures
    const needsUpdate = hoursSinceUpdate > 4;
    
    // Suggestion basée sur le niveau d'énergie
    let suggestion;
    if (currentEnergyLog.level <= 2) {
      suggestion = 'Niveau d\'énergie faible. Prenez une pause ou une collation énergétique.';
    } else if (currentEnergyLog.level >= 4) {
      suggestion = 'Excellent niveau d\'énergie ! Parfait pour les tâches importantes.';
    } else {
      suggestion = 'Niveau d\'énergie modéré. Bon pour les tâches de routine.';
    }
    
    if (needsUpdate) {
      suggestion += ' Il serait bon de mettre à jour votre niveau d\'énergie.';
    }
    
    res.json({
      success: true,
      energy: {
        current: currentEnergyLog.level,
        max: 5,
        lastUpdated: currentEnergyLog.timestamp,
        context: currentEnergyLog.context,
        suggestion
      }
    });
    
  } catch (error) {
    console.error('Energy fetch error:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération du niveau d\'énergie'
    });
  }
});

// Mise à jour du niveau d'énergie
router.post('/energy', requireAuth, validateEnergyUpdate, async (req, res) => {
  try {
    const { level, context = 'manual', notes } = req.body;
    
    const energyLog = new EnergyLog({
      userId: req.userId,
      level: parseInt(level),
      context,
      notes: notes?.trim() || null
    });
    
    await energyLog.save();
    
    res.json({
      success: true,
      message: 'Niveau d\'énergie mis à jour avec succès',
      energy: {
        current: energyLog.level,
        max: 5,
        lastUpdated: energyLog.timestamp,
        context: energyLog.context
      }
    });
    
  } catch (error) {
    console.error('Energy update error:', error);
    res.status(500).json({
      error: 'Erreur lors de la mise à jour du niveau d\'énergie'
    });
  }
});

// Obtenir les éléments flottants (pour la sidebar)
router.get('/floating-tasks', requireAuth, async (req, res) => {
  try {
    const floatingElements = await ScheduleElement.find({
      userId: req.userId,
      type: 'floating',
      isCompleted: false,
      $or: [
        { 'scheduledFor.date': { $exists: false } },
        { 'scheduledFor.date': null }
      ]
    })
    .sort({ priority: -1, energyRequired: 1 })
    .limit(20);
    
    res.json({
      success: true,
      elements: floatingElements.map(element => ({
        id: element._id,
        title: element.title,
        duration: element.duration,
        energyRequired: element.energyRequired,
        category: element.category,
        priority: element.priority,
        color: element.color
      }))
    });
    
  } catch (error) {
    console.error('Floating tasks fetch error:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des tâches flottantes'
    });
  }
});

// Obtenir le planning du jour
router.get('/current', requireAuth, async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Récupérer les éléments fixes et les éléments flottants programmés
    const elements = await ScheduleElement.find({
      userId: req.userId,
      $or: [
        { type: 'fixed' },
        { 
          type: 'floating', 
          'scheduledFor.date': targetDate 
        }
      ]
    }).sort({ startTime: 1, 'scheduledFor.timeSlot': 1 });
    
    res.json({
      success: true,
      date: targetDate,
      elements: elements.map(element => ({
        id: element._id,
        title: element.title,
        type: element.type,
        startTime: element.startTime || element.scheduledFor?.timeSlot,
        endTime: element.endTime,
        duration: element.duration,
        energyRequired: element.energyRequired,
        category: element.category,
        priority: element.priority,
        isCompleted: element.isCompleted,
        color: element.color
      }))
    });
    
  } catch (error) {
    console.error('Current schedule fetch error:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération du planning'
    });
  }
});

// Obtenir suggestions de tâches basées sur l'énergie
router.get('/suggestions', requireAuth, async (req, res) => {
  try {
    const currentEnergyLog = await EnergyLog.getCurrentEnergy(req.userId);
    const currentEnergy = currentEnergyLog?.level || 3;
    
    // Trouver des tâches adaptées au niveau d'énergie
    const suitableTasks = await ScheduleElement.find({
      userId: req.userId,
      type: 'floating',
      isCompleted: false,
      energyRequired: { $lte: currentEnergy + 1 }, // Permettre un peu de flexibilité
      $or: [
        { 'scheduledFor.date': { $exists: false } },
        { 'scheduledFor.date': null }
      ]
    })
    .sort({ 
      priority: -1,
      energyRequired: currentEnergy >= 4 ? -1 : 1 // Si énergie élevée, prioriser les tâches difficiles
    })
    .limit(5);
    
    const suggestions = suitableTasks.map(task => ({
      id: task._id,
      title: task.title,
      duration: task.duration,
      energyRequired: task.energyRequired,
      category: task.category,
      reason: task.energyRequired <= currentEnergy - 1 
        ? 'Parfait pour votre niveau d\'énergie actuel'
        : 'Accessible avec un petit effort supplémentaire'
    }));
    
    res.json({
      success: true,
      currentEnergy,
      suggestions,
      message: suggestions.length === 0 
        ? 'Aucune suggestion disponible pour le moment'
        : `${suggestions.length} tâche(s) adaptée(s) à votre niveau d'énergie`
    });
    
  } catch (error) {
    console.error('Suggestions fetch error:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des suggestions'
    });
  }
});

// Route d'optimisation automatique (placeholder)
router.post('/optimize', requireAuth, async (req, res) => {
  try {
    // TODO: Implémenter l'algorithme d'optimisation
    res.json({
      success: true,
      message: 'Optimisation en cours de développement',
      optimized: false
    });
  } catch (error) {
    console.error('Optimization error:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'optimisation'
    });
  }
});

module.exports = router;