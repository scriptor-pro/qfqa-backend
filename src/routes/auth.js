const express = require('express');
const router = express.Router();

// Middleware simple pour la validation
const validateRegistration = (req, res, next) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({
      error: 'Tous les champs sont requis'
    });
  }
  
  // Validation username (3-20 caractères alphanumériques)
  if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
    return res.status(400).json({
      error: 'Le nom d\'utilisateur doit contenir entre 3 et 20 caractères (lettres, chiffres, _ et - uniquement)'
    });
  }
  
  // Validation email simple
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      error: 'Adresse email invalide'
    });
  }
  
  // Validation password (minimum 8 caractères)
  if (password.length < 8) {
    return res.status(400).json({
      error: 'Le mot de passe doit contenir au moins 8 caractères'
    });
  }
  
  next();
};

// Vérification de disponibilité du nom d'utilisateur
router.get('/check-username/:username', (req, res) => {
  const { username } = req.params;
  
  // TODO: Vérifier en base de données
  // Pour l'instant, simulation
  const unavailableUsernames = ['admin', 'test', 'user', 'qfqa'];
  
  const isAvailable = !unavailableUsernames.includes(username.toLowerCase());
  
  res.json({
    available: isAvailable,
    message: isAvailable ? 'Nom d\'utilisateur disponible' : 'Nom d\'utilisateur déjà pris'
  });
});

// Inscription
router.post('/register', validateRegistration, (req, res) => {
  const { username, email, password } = req.body;
  
  // TODO: Hasher le mot de passe et sauvegarder en base
  // TODO: Créer un JWT token
  
  // Simulation pour l'instant
  console.log('Inscription:', { username, email });
  
  res.status(201).json({
    success: true,
    message: 'Compte créé avec succès',
    user: {
      id: Date.now(),
      username,
      email
    }
  });
});

// Connexion
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      error: 'Email et mot de passe requis'
    });
  }
  
  // TODO: Vérifier les identifiants en base
  // TODO: Générer JWT token
  
  // Simulation pour l'instant
  console.log('Connexion:', { email });
  
  res.json({
    success: true,
    message: 'Connexion réussie',
    user: {
      id: 1,
      username: 'testuser',
      email
    },
    token: 'fake-jwt-token'
  });
});

// Vérification du token
router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      error: 'Token manquant'
    });
  }
  
  // TODO: Vérifier le JWT token
  // Pour l'instant, accepter tous les tokens non vides
  
  res.json({
    valid: true,
    user: {
      id: 1,
      username: 'testuser',
      email: 'test@example.com'
    }
  });
});

// Déconnexion
router.post('/logout', (req, res) => {
  // TODO: Invalider le token si nécessaire (blacklist)
  
  res.json({
    success: true,
    message: 'Déconnexion réussie'
  });
});

module.exports = router;