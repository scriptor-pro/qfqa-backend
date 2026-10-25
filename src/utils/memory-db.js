// In-memory database for local development/testing
const { hashPassword, comparePassword } = require('./password');
const { generateToken } = require('./jwt');

// In-memory storage
const storage = {
  users: new Map(),
  scheduleElements: new Map(),
  energyLogs: new Map(),
  counters: {
    users: 0,
    scheduleElements: 0,
    energyLogs: 0
  }
};

// Helper function to generate IDs
const generateId = (type) => {
  storage.counters[type]++;
  return `${type}_${storage.counters[type]}`;
};

// User operations
const createUser = async (userData) => {
  const { username, email, password } = userData;
  
  // Check for existing user
  for (const user of storage.users.values()) {
    if (user.email === email.toLowerCase() || user.username.toLowerCase() === username.toLowerCase()) {
      throw new Error('User already exists');
    }
  }
  
  const hashedPassword = await hashPassword(password);
  const userId = generateId('users');
  
  const user = {
    _id: userId,
    username,
    email: email.toLowerCase(),
    password: hashedPassword,
    preferences: {
      theme: 'auto',
      energyTracking: true,
      notifications: {
        schedule: true,
        breaks: true,
        lowEnergy: false
      },
      accessibility: {
        reduceMotion: false,
        highContrast: false,
        fontSize: 'medium'
      }
    },
    settings: {
      workingHours: {
        start: '09:00',
        end: '17:00'
      },
      breakReminders: 60,
      energyCheckFrequency: 120
    },
    isEmailVerified: false,
    lastLogin: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  storage.users.set(userId, user);
  return user;
};

const findUserByEmail = async (email) => {
  for (const user of storage.users.values()) {
    if (user.email === email.toLowerCase()) {
      return user;
    }
  }
  return null;
};

const findUserById = async (id) => {
  return storage.users.get(id) || null;
};

const updateUser = async (id, updates) => {
  const user = storage.users.get(id);
  if (!user) return null;
  
  Object.assign(user, updates, { updatedAt: new Date() });
  storage.users.set(id, user);
  return user;
};

// Schedule element operations
const createScheduleElement = async (elementData) => {
  const elementId = generateId('scheduleElements');
  const element = {
    _id: elementId,
    ...elementData,
    isCompleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  storage.scheduleElements.set(elementId, element);
  return element;
};

const findScheduleElements = async (filter = {}) => {
  const elements = Array.from(storage.scheduleElements.values());
  
  return elements.filter(element => {
    for (const [key, value] of Object.entries(filter)) {
      if (key === 'userId' && element.userId !== value) return false;
      if (key === 'type' && element.type !== value) return false;
      if (key === 'isCompleted' && element.isCompleted !== value) return false;
      if (key === 'scheduledFor.date' && element.scheduledFor?.date !== value) return false;
    }
    return true;
  });
};

const updateScheduleElement = async (id, updates) => {
  const element = storage.scheduleElements.get(id);
  if (!element) return null;
  
  Object.assign(element, updates, { updatedAt: new Date() });
  storage.scheduleElements.set(id, element);
  return element;
};

const deleteScheduleElement = async (id) => {
  return storage.scheduleElements.delete(id);
};

// Energy log operations
const createEnergyLog = async (logData) => {
  const logId = generateId('energyLogs');
  const log = {
    _id: logId,
    ...logData,
    timestamp: new Date()
  };
  
  storage.energyLogs.set(logId, log);
  return log;
};

const findLatestEnergyLog = async (userId) => {
  const logs = Array.from(storage.energyLogs.values())
    .filter(log => log.userId === userId)
    .sort((a, b) => b.timestamp - a.timestamp);
  
  return logs[0] || null;
};

const findEnergyLogs = async (userId, startDate = null) => {
  const logs = Array.from(storage.energyLogs.values())
    .filter(log => {
      if (log.userId !== userId) return false;
      if (startDate && log.timestamp < startDate) return false;
      return true;
    })
    .sort((a, b) => a.timestamp - b.timestamp);
  
  return logs;
};

// Statistics helpers
const countElements = async (filter) => {
  const elements = await findScheduleElements(filter);
  return elements.length;
};

// Initialize with sample data
const initializeSampleData = async () => {
  try {
    // Create sample user
    const sampleUser = await createUser({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });
    
    // Create sample schedule elements
    await createScheduleElement({
      userId: sampleUser._id,
      title: 'Petit déjeuner',
      type: 'fixed',
      startTime: '08:00',
      endTime: '08:30',
      energyRequired: 2,
      category: 'routine'
    });
    
    await createScheduleElement({
      userId: sampleUser._id,
      title: 'Travail - emails',
      type: 'floating',
      duration: 30,
      energyRequired: 3,
      category: 'travail',
      priority: 'medium'
    });
    
    await createScheduleElement({
      userId: sampleUser._id,
      title: 'Exercice',
      type: 'floating',
      duration: 45,
      energyRequired: 4,
      category: 'santé',
      priority: 'high'
    });
    
    // Create sample energy log
    await createEnergyLog({
      userId: sampleUser._id,
      level: 3,
      context: 'manual'
    });
    
    console.log('✅ Sample data initialized');
    console.log(`👤 Test user: test@example.com / password123`);
    
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
};

module.exports = {
  // User operations
  createUser,
  findUserByEmail,
  findUserById,
  updateUser,
  
  // Schedule operations
  createScheduleElement,
  findScheduleElements,
  updateScheduleElement,
  deleteScheduleElement,
  countElements,
  
  // Energy operations
  createEnergyLog,
  findLatestEnergyLog,
  findEnergyLogs,
  
  // Utilities
  initializeSampleData,
  storage // For debugging
};