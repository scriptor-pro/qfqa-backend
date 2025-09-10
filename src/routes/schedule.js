const express = require('express');
const router = express.Router();

// Middleware simple d'authentification (pour plus tard)
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      error: 'Authentication requise'
    });
  }
  
  // TODO: Vérifier le JWT token
  // Pour l'instant, passer si token présent
  req.userId = 1; // Simulation
  next();
};

// Récupération des éléments de planning
router.get('/elements', requireAuth, (req, res) => {
  // TODO: Récupérer depuis la base de données
  
  // Données de simulation
  const scheduleElements = [
    {
      id: 1,
      title: 'Petit déjeuner',
      type: 'fixed',
      startTime: '08:00',
      endTime: '08:30',
      energyRequired: 2,
      category: 'routine',
      userId: req.userId
    },
    {
      id: 2,
      title: 'Travail - emails',
      type: 'floating',
      duration: 30,
      energyRequired: 3,
      category: 'travail',
      priority: 'medium',
      userId: req.userId
    },
    {
      id: 3,
      title: 'Exercice',
      type: 'floating',
      duration: 45,
      energyRequired: 4,
      category: 'santé',
      priority: 'high',
      userId: req.userId
    }
  ];
  
  res.json({
    success: true,
    elements: scheduleElements
  });
});

// Ajout d'un élément de planning
router.post('/elements', requireAuth, (req, res) => {
  const { title, type, startTime, endTime, duration, energyRequired, category, priority } = req.body;
  
  if (!title || !type) {
    return res.status(400).json({
      error: 'Titre et type requis'
    });
  }
  
  // Validation du type
  if (!['fixed', 'floating'].includes(type)) {
    return res.status(400).json({
      error: 'Type doit être "fixed" ou "floating"'
    });
  }
  
  // TODO: Sauvegarder en base de données
  
  const newElement = {
    id: Date.now(),
    title,
    type,
    startTime,
    endTime,
    duration,
    energyRequired: energyRequired || 1,
    category: category || 'général',
    priority: priority || 'medium',
    userId: req.userId,
    createdAt: new Date().toISOString()
  };
  
  console.log('Nouvel élément créé:', newElement);
  
  res.status(201).json({
    success: true,
    message: 'Élément ajouté',
    element: newElement
  });
});

// Modification d'un élément
router.put('/elements/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  // TODO: Mettre à jour en base de données
  
  console.log(`Élément ${id} mis à jour:`, updates);
  
  res.json({
    success: true,
    message: 'Élément mis à jour',
    element: { id: parseInt(id), ...updates }
  });
});

// Suppression d'un élément
router.delete('/elements/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  
  // TODO: Supprimer de la base de données
  
  console.log(`Élément ${id} supprimé`);
  
  res.json({
    success: true,
    message: 'Élément supprimé'
  });
});

// Déplacement d'un élément flottant vers un créneau
router.post('/elements/:id/move', requireAuth, (req, res) => {
  const { id } = req.params;
  const { timeSlot, date } = req.body;
  
  if (!timeSlot) {
    return res.status(400).json({
      error: 'Créneau horaire requis'
    });
  }
  
  // TODO: Mettre à jour en base de données
  
  console.log(`Élément ${id} déplacé vers ${timeSlot} le ${date || 'aujourd\'hui'}`);
  
  res.json({
    success: true,
    message: 'Élément déplacé',
    placement: {
      elementId: parseInt(id),
      timeSlot,
      date: date || new Date().toISOString().split('T')[0]
    }
  });
});

// Récupération du niveau d'énergie
router.get('/energy', requireAuth, (req, res) => {
  // TODO: Récupérer depuis la base de données ou calculer
  
  // Simulation basée sur l'heure
  const now = new Date();
  const hour = now.getHours();
  
  let energyLevel;
  if (hour < 8 || hour > 22) {
    energyLevel = 1; // Très fatigué
  } else if (hour < 10 || (hour >= 14 && hour <= 16)) {
    energyLevel = 4; // Pic d'énergie
  } else {
    energyLevel = 3; // Énergie modérée
  }
  
  res.json({
    success: true,
    energy: {
      current: energyLevel,
      max: 5,
      lastUpdated: now.toISOString(),
      suggestion: energyLevel <= 2 ? 'Prenez une pause' : 'Bon moment pour les tâches importantes'
    }
  });
});

// Mise à jour du niveau d'énergie
router.post('/energy', requireAuth, (req, res) => {
  const { level } = req.body;
  
  if (!level || level < 1 || level > 5) {
    return res.status(400).json({
      error: 'Niveau d\'énergie doit être entre 1 et 5'
    });
  }
  
  // TODO: Sauvegarder en base de données
  
  console.log(`Niveau d'énergie mis à jour: ${level}`);
  
  res.json({
    success: true,
    message: 'Niveau d\'énergie mis à jour',
    energy: {
      current: parseInt(level),
      max: 5,
      lastUpdated: new Date().toISOString()
    }
  });
});

module.exports = router;