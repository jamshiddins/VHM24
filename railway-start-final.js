const logger = require('@vhm24/shared/logger');

#!/usr/bin/env node

/**
 * VHM24 Railway Final Start Script
 * Объединяет миграцию и запуск приложения в одном скрипте
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Загружаем переменные окружения
try {
  require('dotenv').config();
} catch (error) {
  logger.info('⚠️  dotenv not available, using environment variables');
}

logger.info('🚂 VHM24 Railway Final Start...');
logger.info(`📍 Environment: ${process.env.NODE_ENV || 'production'}`);
logger.info(`🔌 Port: ${process.env.PORT || 8000}`);

// Устанавливаем переменные окружения
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || '8000';

// Проверяем обязательные переменные
if (!process.env.DATABASE_URL) {
  logger.error('❌ DATABASE_URL is required for Railway deployment');
  process.exit(1);
}

// Функция для запуска команды
function runCommand(command, args = [], options = {}) {
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
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    child.on('error', reject);
  });
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
async function startRailwayApp() {
  try {
    logger.info('🗄️  === DATABASE MIGRATION PHASE ===');
    
    // Проверяем наличие schema.prisma
    const schemaPath = path.join(__dirname, 'packages/database/prisma/schema.prisma');
    if (!fs.existsSync(schemaPath)) {
      throw new Error('Prisma schema not found at packages/database/prisma/schema.prisma');
    }
    
    logger.info('✅ Prisma schema found');
    
    // Генерируем Prisma клиент
    logger.info('🔧 Generating Prisma client...');
    await runCommand('npx', ['prisma', 'generate'], {
      cwd: path.join(__dirname, 'packages/database')
    });
    logger.info('✅ Prisma client generated');
    
    // Запускаем миграции
    logger.info('🔧 Running database migrations...');
    await runCommand('npx', ['prisma', 'migrate', 'deploy'], {
      cwd: path.join(__dirname, 'packages/database')
    });
    logger.info('✅ Database migrations completed');
    
    // Проверяем подключение к базе данных
    logger.info('🔧 Testing database connection...');
    const { getAuthClient } = require('./packages/database');
    const prisma = getAuthClient();
    
    await prisma.$connect();
    logger.info('✅ Database connection successful');
    
    // Проверяем наличие пользователей
    const userCount = await prisma.user.count();
    logger.info(`📊 Users in database: ${userCount}`);
    
    // Создаем администратора если нет пользователей
    if (userCount === 0) {
      logger.info('🔧 Creating default admin user...');
      const bcrypt = require('bcrypt');
      
      const adminUser = await prisma.user.create({
        data: {
          email: 'admin@vhm24.ru',
          name: 'System Administrator',
          passwordHash: await bcrypt.hash('admin123', 10),
          telegramId: process.env.ADMIN_IDS || '42283329',
          roles: ['ADMIN'],
          isActive: true
        }
      });
      
      logger.info('✅ Default admin user created');
      logger.info(`📧 Email: admin@vhm24.ru`);
      logger.info(`🔑 Password: admin123`);
      logger.info(`📱 Telegram ID: ${adminUser.telegramId}`);
    }
    
    await prisma.$disconnect();
    logger.info('🎉 Database migration completed successfully!');
    
    logger.info('\n🚂 === APPLICATION DEPLOYMENT PHASE ===');
    
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
    logger.info(`🌐 Application will be available on port ${process.env.PORT}`);
    
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

// Запускаем приложение
startRailwayApp();
