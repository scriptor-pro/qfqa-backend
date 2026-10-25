const express = require('express');
const router = express.Router();

const User = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const { requireAuth } = require('../middleware/auth');
const { 
  validateRegistration, 
  validateLogin, 
  validateUsername,
  validatePasswordChange 
} = require('../middleware/validation');

// Import memory database for fallback
const memoryDB = require('../utils/memory-db');

// Check if we're using memory database (no MongoDB available)
const useMemoryDB = process.env.NODE_ENV === 'development';

// Vérification de disponibilité du nom d'utilisateur
router.get('/check-username/:username', validateUsername, async (req, res) => {
  try {
    const { username } = req.params;
    
    let existingUser;
    if (useMemoryDB) {
      // Check in memory database
      for (const user of memoryDB.storage.users.values()) {
        if (user.username.toLowerCase() === username.toLowerCase()) {
          existingUser = user;
          break;
        }
      }
    } else {
      existingUser = await User.findOne({ 
        username: { $regex: new RegExp(`^${username}$`, 'i') } 
      });
    }
    
    const isAvailable = !existingUser;
    
    res.json({
      available: isAvailable,
      message: isAvailable ? 'Nom d\'utilisateur disponible' : 'Nom d\'utilisateur déjà pris'
    });
  } catch (error) {
    console.error('Error checking username:', error);
    res.status(500).json({
      error: 'Erreur lors de la vérification du nom d\'utilisateur'
    });
  }
});

// Inscription
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    let user;
    if (useMemoryDB) {
      try {
        user = await memoryDB.createUser({ username, email, password });
      } catch (error) {
        return res.status(409).json({
          error: 'Cette adresse email ou ce nom d\'utilisateur est déjà utilisé'
        });
      }
    } else {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findOne({
        $or: [
          { email: email.toLowerCase() },
          { username: { $regex: new RegExp(`^${username}$`, 'i') } }
        ]
      });
      
      if (existingUser) {
        return res.status(409).json({
          error: existingUser.email === email.toLowerCase() 
            ? 'Cette adresse email est déjà utilisée' 
            : 'Ce nom d\'utilisateur est déjà pris'
        });
      }
      
      // Hasher le mot de passe
      const hashedPassword = await hashPassword(password);
      
      // Créer l'utilisateur
      user = new User({
        username,
        email: email.toLowerCase(),
        password: hashedPassword
      });
      
      await user.save();
    }
    
    // Générer le token JWT
    const token = generateToken({
      id: user._id,
      username: user.username,
      email: user.email
    });
    
    // Réponse sans le mot de passe
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt
    };
    
    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      user: userResponse,
      token
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Erreur lors de la création du compte'
    });
  }
});

// Connexion
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    let user;
    if (useMemoryDB) {
      user = await memoryDB.findUserByEmail(email);
    } else {
      user = await User.findOne({ email: email.toLowerCase() });
    }
    
    if (!user) {
      return res.status(401).json({
        error: 'Email ou mot de passe incorrect'
      });
    }
    
    // Vérifier le mot de passe
    const isPasswordValid = await comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Email ou mot de passe incorrect'
      });
    }
    
    // Mettre à jour la dernière connexion
    const lastLogin = new Date();
    if (useMemoryDB) {
      await memoryDB.updateUser(user._id, { lastLogin });
      user.lastLogin = lastLogin;
    } else {
      user.lastLogin = lastLogin;
      await user.save();
    }
    
    // Générer le token JWT
    const token = generateToken({
      id: user._id,
      username: user.username,
      email: user.email
    });
    
    // Réponse sans le mot de passe
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      lastLogin: user.lastLogin,
      preferences: user.preferences
    };
    
    res.json({
      success: true,
      message: 'Connexion réussie',
      user: userResponse,
      token
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Erreur lors de la connexion'
    });
  }
});

// Vérification du token
router.get('/verify', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        error: 'Utilisateur non trouvé'
      });
    }
    
    res.json({
      valid: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        preferences: user.preferences,
        lastLogin: user.lastLogin
      }
    });
    
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      error: 'Erreur lors de la vérification du token'
    });
  }
});

// Déconnexion
router.post('/logout', requireAuth, (req, res) => {
  // With JWT, logout is handled client-side by removing the token
  // Here we could implement token blacklisting if needed
  
  res.json({
    success: true,
    message: 'Déconnexion réussie'
  });
});

// Changement de mot de passe
router.post('/change-password', requireAuth, validatePasswordChange, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        error: 'Utilisateur non trouvé'
      });
    }
    
    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        error: 'Mot de passe actuel incorrect'
      });
    }
    
    // Hasher et sauvegarder le nouveau mot de passe
    user.password = await hashPassword(newPassword);
    await user.save();
    
    res.json({
      success: true,
      message: 'Mot de passe mis à jour avec succès'
    });
    
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      error: 'Erreur lors du changement de mot de passe'
    });
  }
});

module.exports = router;