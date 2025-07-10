const logger = require('@vhm24/shared/logger');

#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Определяем окружение
const isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_STATIC_URL || process.env.RAILWAY_PROJECT_ID;
const isProduction = process.env.NODE_ENV === 'production' || isRailway;

logger.info('🚀 VHM24 Platform Starting...');
logger.info(`📍 Environment: ${isProduction ? 'Production' : 'Development'}`);
logger.info(`🚂 Railway: ${isRailway ? 'Yes' : 'No'}`);

// Функция для запуска процесса
function startProcess(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    logger.info(`🔧 Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

// Основная функция запуска
async function start() {
  try {
    // Устанавливаем переменные окружения по умолчанию
    process.env.PORT = process.env.PORT || '8000';
    process.env.NODE_ENV = process.env.NODE_ENV || (isRailway ? 'production' : 'development');

    if (isRailway) {
      logger.info('🚂 Starting in Railway mode...');
      
      // Проверяем наличие необходимых переменных
      if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is required for Railway deployment');
      }
      
      // Генерируем Prisma клиент
      if (fs.existsSync('packages/database/prisma/schema.prisma')) {
        logger.info('🔧 Generating Prisma client...');
        try {
          await startProcess('npx', ['prisma', 'generate'], {
            cwd: 'packages/database'
          });
          logger.info('✅ Prisma client generated successfully');
        } catch (error) {
          logger.error('❌ Failed to generate Prisma client:', error.message);
          // Продолжаем выполнение, возможно клиент уже сгенерирован
        }
      }

      // В Railway запускаем только Gateway (основной сервис)
      logger.info('📡 Starting Gateway service for Railway...');
      
      // Загружаем dotenv для Railway
      try {
        require('dotenv').config();
      } catch (error) {
        logger.info('⚠️  dotenv not available, using environment variables');
      }
      
      // Запускаем Gateway
      require('./services/gateway/src/index.js');
      
    } else {
      logger.info('💻 Starting in local development mode...');
      
      // Проверяем наличие .env файла
      if (!fs.existsSync('.env')) {
        logger.info('⚠️  .env file not found, using environment variables');
      }
      
      // Локально запускаем все сервисы через start.js
      require('./start.js');
    }

  } catch (error) {
    logger.error('❌ Failed to start application:', error.message);
    logger.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Обработка сигналов завершения
process.on('SIGTERM', () => {
  logger.info('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Запускаем приложение
start();
