const logger = require('@vhm24/shared/logger');

#!/usr/bin/env node

/**
 * VHM24 Railway Deployment Script
 * Запускает все сервисы в одном процессе для Railway
 */

const path = require('path');
const fs = require('fs');

// Загружаем переменные окружения
try {
  require('dotenv').config();
} catch (error) {
  logger.info('⚠️  dotenv not available, using environment variables');
}

logger.info('🚂 VHM24 Railway Deployment Starting...');
logger.info(`📍 Environment: ${process.env.NODE_ENV || 'production'}`);
logger.info(`🔌 Port: ${process.env.PORT || 8000}`);

// Устанавливаем переменные окружения
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || '8000';

// Проверяем обязательные переменные
const requiredEnvVars = ['DATABASE_URL'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  logger.error('❌ Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

// Функция для запуска сервиса
async function startService(serviceName, servicePath, port) {
  try {
    logger.info(`🚀 Starting ${serviceName} service on port ${port}...`);
    
    // Устанавливаем порт для сервиса
    process.env[`${serviceName.toUpperCase()}_PORT`] = port;
    
    // Запускаем сервис
    require(servicePath);
    
    logger.info(`✅ ${serviceName} service started successfully`);
    return true;
  } catch (error) {
    logger.error(`❌ Failed to start ${serviceName} service:`, error.message);
    return false;
  }
}

// Основная функция
async function deployToRailway() {
  try {
    logger.info('🔧 Initializing Railway deployment...');
    
    // Генерируем Prisma клиент если нужно
    if (fs.existsSync('packages/database/prisma/schema.prisma')) {
      logger.info('🔧 Checking Prisma client...');
      try {
        const { getAuthClient } = require('./packages/database');
        await getAuthClient().$connect();
        logger.info('✅ Prisma client is ready');
      } catch (error) {
        logger.info('⚠️  Prisma client needs generation, this is normal on first deploy');
      }
    }

    // Запускаем сервисы последовательно
    const services = [
      { name: 'Auth', path: './services/auth/src/index.js', port: 3001 },
      { name: 'Machines', path: './services/machines/src/index.js', port: 3002 },
      { name: 'Inventory', path: './services/inventory/src/index.js', port: 3003 },
      { name: 'Tasks', path: './services/tasks/src/index.js', port: 3004 },
      { name: 'Bunkers', path: './services/bunkers/src/index.js', port: 3005 },
      { name: 'Notifications', path: './services/notifications/src/index.js', port: 3006 }
    ];

    // Запускаем сервисы в фоне
    for (const service of services) {
      if (fs.existsSync(service.path)) {
        setTimeout(() => {
          startService(service.name, service.path, service.port);
        }, 1000); // Небольшая задержка между запусками
      } else {
        logger.info(`⚠️  Service ${service.name} not found at ${service.path}`);
      }
    }

    // Запускаем Telegram Bot если токен есть
    if (process.env.TELEGRAM_BOT_TOKEN && fs.existsSync('./services/telegram-bot/src/index.js')) {
      setTimeout(() => {
        logger.info('🤖 Starting Telegram Bot...');
        require('./services/telegram-bot/src/index.js');
      }, 2000);
    }

    // Запускаем Gateway последним (основной сервис)
    setTimeout(() => {
      logger.info('📡 Starting Gateway service (main)...');
      require('./services/gateway/src/index.js');
    }, 3000);

    logger.info('🎉 All services initialization started!');
    
  } catch (error) {
    logger.error('❌ Railway deployment failed:', error.message);
    logger.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Обработка сигналов
process.on('SIGTERM', () => {
  logger.info('🛑 Received SIGTERM, shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('🛑 Received SIGINT, shutting down...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection:', reason);
  process.exit(1);
});

// Запускаем деплой
deployToRailway();
