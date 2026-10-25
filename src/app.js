const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { connectDatabase } = require('./utils/database');
const memoryDB = require('./utils/memory-db');
const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Trop de requêtes, veuillez réessayer plus tard',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // limit auth requests
  message: {
    error: 'Trop de tentatives de connexion, veuillez réessayer plus tard',
    retryAfter: '15 minutes'
  }
});

app.use('/api/auth', authLimiter);
app.use('/api', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://qfqa.netlify.app', 'https://www.qfqa.netlify.app', 'https://api.qfqa.eu']
    : ['http://localhost:3000', process.env.FRONTEND_URL || 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Import des routes
const authRoutes = require('./routes/auth');
const scheduleRoutes = require('./routes/schedule');
const userRoutes = require('./routes/user');

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

// Initialize database and start server
const startServer = async () => {
  // Try to connect to database
  const dbConnected = await connectDatabase();
  
  // If no database, initialize in-memory storage with sample data
  if (!dbConnected && process.env.NODE_ENV === 'development') {
    console.log('🧠 Initializing in-memory database with sample data...');
    await memoryDB.initializeSampleData();
  }
  
  // Start server
  app.listen(PORT, () => {
    console.log(`🚀 QFQA Backend server running on port ${PORT}`);
    console.log(`📱 Health check: http://localhost:${PORT}/health`);
    console.log(`🔧 API test: http://localhost:${PORT}/api/test`);
    console.log(`🔒 Security: Helmet, Rate limiting, CORS enabled`);
    if (dbConnected) {
      console.log(`🗄️  Database: MongoDB connected`);
    } else {
      console.log(`🧠 Database: In-memory storage (development mode)`);
    }
  });
};

startServer().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  process.exit(0);
});

module.exports = app;