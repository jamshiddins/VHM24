const logger = require('@vhm24/shared/logger');

#!/usr/bin/env node

/**
 * VHM24 Railway Database Migration Script
 * Запускает миграции базы данных для Railway
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

logger.info('🗄️  VHM24 Railway Database Migration Starting...');
logger.info(`📍 Environment: ${process.env.NODE_ENV || 'production'}`);

// Проверяем обязательные переменные
if (!process.env.DATABASE_URL) {
  logger.error('❌ DATABASE_URL is required for migration');
  process.exit(1);
}

// Функция для запуска команды
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    logger.info(`🔧 Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd: path.join(__dirname, 'packages/database'),
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

// Основная функция миграции
async function migrateDatabase() {
  try {
    logger.info('🔧 Starting database migration...');
    
    // Проверяем наличие schema.prisma
    const schemaPath = path.join(__dirname, 'packages/database/prisma/schema.prisma');
    if (!fs.existsSync(schemaPath)) {
      throw new Error('Prisma schema not found at packages/database/prisma/schema.prisma');
    }
    
    logger.info('✅ Prisma schema found');
    
    // Генерируем Prisma клиент
    logger.info('🔧 Generating Prisma client...');
    await runCommand('npx', ['prisma', 'generate']);
    logger.info('✅ Prisma client generated');
    
    // Запускаем миграции
    logger.info('🔧 Running database migrations...');
    await runCommand('npx', ['prisma', 'migrate', 'deploy']);
    logger.info('✅ Database migrations completed');
    
    // Проверяем подключение к базе данных
    logger.info('🔧 Testing database connection...');
    const { getAuthClient } = require('./packages/database');
    const prisma = getAuthClient();
    
    await prisma.$connect();
    logger.info('✅ Database connection successful');
    
    // Проверяем наличие таблиц
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
    
  } catch (error) {
    logger.error('❌ Database migration failed:', error.message);
    logger.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Запускаем миграцию
migrateDatabase();
