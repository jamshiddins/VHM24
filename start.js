const logger = require('@vhm24/shared/logger');

/**
 * VHM24 Platform - Unified Start Script
 * Handles both development and production (Railway) environments
 */

// Load environment variables only in local development
if (!process.env.RAILWAY_ENVIRONMENT) {
  require('dotenv').config();
}

const { spawn } = require('child_process');
const path = require('path');

logger.info('🚀 VHM24 Platform starting...');
logger.info('Environment:', process.env.RAILWAY_ENVIRONMENT || 'development');
logger.info('Mode:', process.env.RAILWAY_ENVIRONMENT ? 'Single Process (Railway)' : 'Multi Process (Development)');
logger.info('Port:', process.env.PORT || 8000);

// Check critical environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
  logger.error('❌ Missing required environment variables:', missingVars.join(', '));
  logger.error('Please set them in your .env file or Railway dashboard');
  
  // Start Gateway in limited mode (no database)
  logger.info('⚠️  Starting in limited mode (Gateway only, no database)...');
}

// Services configuration
const services = [
  {
    name: 'Auth',
    path: './services/auth/src/index.js',
    port: process.env.AUTH_PORT || 3001,
    env: { PORT: process.env.AUTH_PORT || 3001 }
  },
  {
    name: 'Machines',
    path: './services/machines/src/index.js',
    port: process.env.MACHINES_PORT || 3002,
    env: { PORT: process.env.MACHINES_PORT || 3002 }
  },
  {
    name: 'Inventory',
    path: './services/inventory/src/index.js',
    port: process.env.INVENTORY_PORT || 3003,
    env: { PORT: process.env.INVENTORY_PORT || 3003 }
  },
  {
    name: 'Tasks',
    path: './services/tasks/src/index.js',
    port: process.env.TASKS_PORT || 3004,
    env: { PORT: process.env.TASKS_PORT || 3004 }
  },
  {
    name: 'Bunkers',
    path: './services/bunkers/src/index.js',
    port: process.env.BUNKERS_PORT || 3005,
    env: { PORT: process.env.BUNKERS_PORT || 3005 }
  },
  {
    name: 'Notifications',
    path: './services/notifications/src/index.js',
    port: process.env.NOTIFICATIONS_PORT || 3006,
    env: { PORT: process.env.NOTIFICATIONS_PORT || 3006 }
  }
];

// Add Telegram Bot if token is provided
if (process.env.TELEGRAM_BOT_TOKEN) {
  services.push({
    name: 'Telegram Bot',
    path: './services/telegram-bot/src/index.js',
    env: {}
  });
}

// Gateway service (always last)
const gatewayService = {
  name: 'Gateway',
  path: './services/gateway/src/index.js',
  port: parseInt(process.env.PORT || process.env.GATEWAY_PORT || 8000),
  env: { PORT: parseInt(process.env.PORT || process.env.GATEWAY_PORT || 8000) }
};

// Railway mode - single process
if (process.env.RAILWAY_ENVIRONMENT) {
  logger.info('\n📦 Running in Railway mode (single process)...\n');
  
  // Function to start service in the same process
  function startServiceInProcess(servicePath, serviceName) {
    try {
      logger.info(`Starting ${serviceName}...`);
      require(servicePath);
      logger.info(`✅ ${serviceName} started`);
    } catch (error) {
      logger.error(`❌ Failed to start ${serviceName}:`, error.message);
    }
  }
  
  // Start all services sequentially in one process
  async function startAllInProcess() {
    // Small delay for initialization
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Start microservices
    for (const service of services) {
      startServiceInProcess(service.path, service.name);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Gateway starts last
    logger.info('Starting Gateway (main service)...');
    require(gatewayService.path);
    
    logger.info('\n✅ All services started!');
    logger.info('\n📍 Access your API at:');
    logger.info(`${process.env.RAILWAY_STATIC_URL || 'http://localhost:' + gatewayService.port}`);
  }
  
  // Start in single process mode
  startAllInProcess().catch(error => {
    logger.error('Failed to start services:', error);
    process.exit(1);
  });
  
} else {
  // Development mode - multiple processes
  logger.info('\n🔧 Running in development mode (multiple processes)...\n');
  
  const processes = [];
  
  // Function to start a service in separate process
  function startService(service) {
    logger.info(`Starting ${service.name} service...`);
    
    const child = spawn('node', [service.path], {
      env: { ...process.env, ...service.env },
      stdio: 'inherit'
    });

    child.on('error', (error) => {
      logger.error(`Error starting ${service.name}:`, error);
      process.exit(1);
    });

    child.on('exit', (code) => {
      if (code !== 0) {
        logger.error(`${service.name} exited with code ${code}`);
        process.exit(code);
      }
    });

    return child;
  }
  
  // Start all services with delay
  async function startAllServices() {
    // Start microservices first
    for (const service of services) {
      const child = startService(service);
      processes.push(child);
      
      // Wait 2 seconds between service starts
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Start Gateway last
    const gatewayProcess = startService(gatewayService);
    processes.push(gatewayProcess);
    
    logger.info('\n✅ All services started successfully!');
    logger.info('\n📍 Service URLs:');
    logger.info(`Gateway: http://localhost:${gatewayService.port}`);
    logger.info(`Health: http://localhost:${gatewayService.port}/health`);
    logger.info(`API: http://localhost:${gatewayService.port}/api/v1`);
    
    if (process.env.TELEGRAM_BOT_TOKEN) {
      logger.info('\n🤖 Telegram Bot is active');
    }
  }
  
  // Start services
  startAllServices().catch(error => {
    logger.error('Failed to start services:', error);
    process.exit(1);
  });
  
  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('\n🛑 Shutting down services...');
    processes.forEach(child => {
      child.kill('SIGTERM');
    });
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logger.info('\n🛑 Shutting down services...');
    processes.forEach(child => {
      child.kill('SIGTERM');
    });
    process.exit(0);
  });
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
