import express from 'express';
import dotenv from 'dotenv';
import winston from 'winston';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import routes
import bunkerRoutes from './routes/bunkerRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import weighingRoutes from './routes/weighingRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../../.env') });

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: join(__dirname, '../logs/error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: join(__dirname, '../logs/combined.log') 
    })
  ]
});

// Create Express app
const app = express();
const PORT = process.env.BUNKERS_SERVICE_PORT || 8006;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    query: req.query,
    body: req.body,
    ip: req.ip
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'bunkers',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    redis: redis?.isReady ? 'connected' : 'disconnected'
  });
});

// API Routes
app.use('/api/v1/bunkers', bunkerRoutes);
app.use('/api/v1/bunkers/history', historyRoutes);
app.use('/api/v1/bunkers/weighing', weighingRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  
  res.status(status).json({
    success: false,
    error: {
      message,
      status,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      status: 404
    }
  });
});

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vhm24-bunkers';

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  logger.info('Connected to MongoDB');
})
.catch((error) => {
  logger.error('MongoDB connection error:', error);
  process.exit(1);
});

// Redis connection
let redis;
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

async function connectRedis() {
  try {
    redis = createClient({ url: redisUrl });
    
    redis.on('error', (err) => {
      logger.error('Redis error:', err);
    });
    
    redis.on('connect', () => {
      logger.info('Connected to Redis');
    });
    
    await redis.connect();
    
    // Make redis available globally
    global.redis = redis;
  } catch (error) {
    logger.error('Redis connection error:', error);
  }
}

// Service registry
async function registerService() {
  try {
    const response = await fetch(`${process.env.GATEWAY_URL || 'http://localhost:4000'}/api/v1/registry/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'bunkers',
        url: `http://localhost:${PORT}`,
        healthCheck: '/health'
      })
    });
    
    if (response.ok) {
      logger.info('Service registered with gateway');
    }
  } catch (error) {
    logger.error('Failed to register service:', error);
  }
}

// Graceful shutdown
async function gracefulShutdown() {
  logger.info('Shutting down gracefully...');
  
  // Close MongoDB connection
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
  
  // Close Redis connection
  if (redis) {
    await redis.quit();
    logger.info('Redis connection closed');
  }
  
  // Exit process
  process.exit(0);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
async function startServer() {
  await connectRedis();
  
  app.listen(PORT, () => {
    logger.info(`Bunkers service running on port ${PORT}`);
    
    // Register with gateway after startup
    setTimeout(registerService, 2000);
  });
}

startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

export { app, logger };
