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
  console.log('⚠️  dotenv not available, using environment variables');
}

console.log('🚂 VHM24 Railway Final Start...');
console.log(`📍 Environment: ${process.env.NODE_ENV || 'production'}`);
console.log(`🔌 Port: ${process.env.PORT || 8000}`);

// Устанавливаем переменные окружения
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || '8000';

// Проверяем обязательные переменные
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is required for Railway deployment');
  process.exit(1);
}

// Функция для запуска команды
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`🔧 Running: ${command} ${args.join(' ')}`);
    
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
    console.log(`🚀 Starting ${serviceName} service on port ${port}...`);
    
    // Устанавливаем порт для сервиса
    process.env[`${serviceName.toUpperCase()}_PORT`] = port;
    
    // Запускаем сервис
    require(servicePath);
    
    console.log(`✅ ${serviceName} service started successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to start ${serviceName} service:`, error.message);
    return false;
  }
}

// Основная функция
async function startRailwayApp() {
  try {
    console.log('🗄️  === DATABASE MIGRATION PHASE ===');
    
    // Проверяем наличие schema.prisma
    const schemaPath = path.join(__dirname, 'packages/database/prisma/schema.prisma');
    if (!fs.existsSync(schemaPath)) {
      throw new Error('Prisma schema not found at packages/database/prisma/schema.prisma');
    }
    
    console.log('✅ Prisma schema found');
    
    // Генерируем Prisma клиент
    console.log('🔧 Generating Prisma client...');
    await runCommand('npx', ['prisma', 'generate'], {
      cwd: path.join(__dirname, 'packages/database')
    });
    console.log('✅ Prisma client generated');
    
    // Запускаем миграции
    console.log('🔧 Running database migrations...');
    await runCommand('npx', ['prisma', 'migrate', 'deploy'], {
      cwd: path.join(__dirname, 'packages/database')
    });
    console.log('✅ Database migrations completed');
    
    // Проверяем подключение к базе данных
    console.log('🔧 Testing database connection...');
    const { getAuthClient } = require('./packages/database');
    const prisma = getAuthClient();
    
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Проверяем наличие пользователей
    const userCount = await prisma.user.count();
    console.log(`📊 Users in database: ${userCount}`);
    
    // Создаем администратора если нет пользователей
    if (userCount === 0) {
      console.log('🔧 Creating default admin user...');
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
      
      console.log('✅ Default admin user created');
      console.log(`📧 Email: admin@vhm24.ru`);
      console.log(`🔑 Password: admin123`);
      console.log(`📱 Telegram ID: ${adminUser.telegramId}`);
    }
    
    await prisma.$disconnect();
    console.log('🎉 Database migration completed successfully!');
    
    console.log('\n🚂 === APPLICATION DEPLOYMENT PHASE ===');
    
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
        console.log(`⚠️  Service ${service.name} not found at ${service.path}`);
      }
    }

    // Запускаем Telegram Bot если токен есть
    if (process.env.TELEGRAM_BOT_TOKEN && fs.existsSync('./services/telegram-bot/src/index.js')) {
      setTimeout(() => {
        console.log('🤖 Starting Telegram Bot...');
        require('./services/telegram-bot/src/index.js');
      }, 2000);
    }

    // Запускаем Gateway последним (основной сервис)
    setTimeout(() => {
      console.log('📡 Starting Gateway service (main)...');
      require('./services/gateway/src/index.js');
    }, 3000);

    console.log('🎉 All services initialization started!');
    console.log(`🌐 Application will be available on port ${process.env.PORT}`);
    
  } catch (error) {
    console.error('❌ Railway deployment failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Обработка сигналов
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
  process.exit(1);
});

// Запускаем приложение
startRailwayApp();
