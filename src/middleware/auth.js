const { verifyToken } = require('../utils/jwt');

const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Token d\'authentification requis',
        code: 'AUTH_MISSING_TOKEN'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: 'Format de token invalide',
        code: 'AUTH_INVALID_FORMAT'
      });
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    req.userId = decoded.id;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token invalide',
        code: 'AUTH_INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expiré',
        code: 'AUTH_TOKEN_EXPIRED'
      });
    }
    
    return res.status(500).json({
      error: 'Erreur d\'authentification',
      code: 'AUTH_SERVER_ERROR'
    });
  }
};

const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      if (token) {
        const decoded = verifyToken(token);
        req.user = decoded;
        req.userId = decoded.id;
      }
    }
    
    next();
  } catch (error) {
    // For optional auth, we continue even if token is invalid
    next();
  }
};

module.exports = {
  requireAuth,
  optionalAuth
};