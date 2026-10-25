const mongoose = require('mongoose');

const connectDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/qfqa';
    
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Database connected successfully');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ Database connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  Database disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ Database reconnected');
    });
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    // In development, continue without database
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Running in development mode without database');
      return false;
    }
    
    // In production, exit if can't connect
    process.exit(1);
  }
  
  return true;
};

const disconnectDatabase = async () => {
  try {
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
};

module.exports = {
  connectDatabase,
  disconnectDatabase
};