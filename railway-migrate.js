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
  console.log('⚠️  dotenv not available, using environment variables');
}

console.log('🗄️  VHM24 Railway Database Migration Starting...');
console.log(`📍 Environment: ${process.env.NODE_ENV || 'production'}`);

// Проверяем обязательные переменные
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is required for migration');
  process.exit(1);
}

// Функция для запуска команды
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`🔧 Running: ${command} ${args.join(' ')}`);
    
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
    console.log('🔧 Starting database migration...');
    
    // Проверяем наличие schema.prisma
    const schemaPath = path.join(__dirname, 'packages/database/prisma/schema.prisma');
    if (!fs.existsSync(schemaPath)) {
      throw new Error('Prisma schema not found at packages/database/prisma/schema.prisma');
    }
    
    console.log('✅ Prisma schema found');
    
    // Генерируем Prisma клиент
    console.log('🔧 Generating Prisma client...');
    await runCommand('npx', ['prisma', 'generate']);
    console.log('✅ Prisma client generated');
    
    // Запускаем миграции
    console.log('🔧 Running database migrations...');
    await runCommand('npx', ['prisma', 'migrate', 'deploy']);
    console.log('✅ Database migrations completed');
    
    // Проверяем подключение к базе данных
    console.log('🔧 Testing database connection...');
    const { getAuthClient } = require('./packages/database');
    const prisma = getAuthClient();
    
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Проверяем наличие таблиц
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
    
  } catch (error) {
    console.error('❌ Database migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Запускаем миграцию
migrateDatabase();
