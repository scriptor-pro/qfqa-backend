const { body, param, query, validationResult } = require('express-validator');
const { validatePasswordStrength } = require('../utils/password');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Données invalides',
      details: errors.array()
    });
  }
  next();
};

// User validation rules
const validateRegistration = [
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('Le nom d\'utilisateur doit contenir entre 3 et 20 caractères')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, _ et -'),
  
  body('email')
    .isEmail()
    .withMessage('Adresse email invalide')
    .normalizeEmail(),
  
  body('password')
    .custom((value) => {
      const validation = validatePasswordStrength(value);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      return true;
    }),
  
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Adresse email invalide')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Mot de passe requis'),
  
  handleValidationErrors
];

const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Mot de passe actuel requis'),
  
  body('newPassword')
    .custom((value) => {
      const validation = validatePasswordStrength(value);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      return true;
    }),
  
  handleValidationErrors
];

// Schedule element validation
const validateScheduleElement = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Le titre doit contenir entre 1 et 200 caractères'),
  
  body('type')
    .isIn(['fixed', 'floating'])
    .withMessage('Le type doit être "fixed" ou "floating"'),
  
  body('energyRequired')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Le niveau d\'énergie doit être entre 1 et 5'),
  
  body('category')
    .optional()
    .isIn(['travail', 'personnel', 'santé', 'routine', 'loisir', 'social', 'apprentissage', 'autre'])
    .withMessage('Catégorie invalide'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priorité invalide'),
  
  body('startTime')
    .if(body('type').equals('fixed'))
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Format d\'heure invalide (HH:MM)'),
  
  body('endTime')
    .if(body('type').equals('fixed'))
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Format d\'heure invalide (HH:MM)'),
  
  body('duration')
    .if(body('type').equals('floating'))
    .isInt({ min: 1, max: 480 })
    .withMessage('Durée doit être entre 1 et 480 minutes'),
  
  handleValidationErrors
];

// Energy validation
const validateEnergyUpdate = [
  body('level')
    .isInt({ min: 1, max: 5 })
    .withMessage('Le niveau d\'énergie doit être entre 1 et 5'),
  
  body('context')
    .optional()
    .isIn(['manual', 'scheduled_check', 'after_task', 'break_time'])
    .withMessage('Contexte invalide'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Les notes ne peuvent pas dépasser 500 caractères'),
  
  handleValidationErrors
];

// ID validation
const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('ID invalide'),
  
  handleValidationErrors
];

const validateUsername = [
  param('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('Nom d\'utilisateur invalide')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Nom d\'utilisateur invalide'),
  
  handleValidationErrors
];

// Query validation
const validateStatsQuery = [
  query('period')
    .optional()
    .isIn(['day', 'week', 'month'])
    .withMessage('Période doit être "day", "week" ou "month"'),
  
  handleValidationErrors
];

module.exports = {
  validateRegistration,
  validateLogin,
  validatePasswordChange,
  validateScheduleElement,
  validateEnergyUpdate,
  validateObjectId,
  validateUsername,
  validateStatsQuery,
  handleValidationErrors
};