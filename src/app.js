const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Import des routes
const authRoutes = require('./routes/auth');
const scheduleRoutes = require('./routes/schedule');
const userRoutes = require('./routes/user');

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://qfqa.netlify.app', 'https://www.qfqa.netlify.app']
    : ['http://localhost:3000', process.env.FRONTEND_URL],
  credentials: true
}));
app.use(express.json());

// Middleware de logging simple
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes principales
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'QFQA Backend is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/user', userRoutes);

// Route de test
app.get('/api/test', (req, res) => {
  res.json({
    message: 'QFQA API is working',
    endpoints: {
      auth: '/api/auth',
      schedule: '/api/schedule',
      user: '/api/user'
    }
  });
});

// Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
  console.error('Erreur:', err);
  
  res.status(err.status || 500).json({
    error: err.message || 'Erreur interne du serveur',
    timestamp: new Date().toISOString()
  });
});

// Route 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.path,
    method: req.method
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 QFQA Backend server running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 API test: http://localhost:${PORT}/api/test`);
});

module.exports = app;