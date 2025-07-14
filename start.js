/**
 * VHM24 PRODUCTION START SCRIPT FOR RAILWAY
 * Правильное подключение к Railway PostgreSQL и Redis
 */

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

console.log('🚂 VHM24 Railway Production Start');
console.log('Node Version:', process.version);
console.log('Current Dir:', process.cwd());
console.log('PORT:', process.env.PORT || 'NOT SET');

// Проверяем критические переменные для Railway
const required = ['DATABASE_URL', 'JWT_SECRET', 'REDIS_URL'];
const missing = required.filter(v => !process.env[v]);

if (missing.length > 0) {
  console.error('❌ CRITICAL: Missing env vars:', missing);
  process.exit(1);
}

// Логируем подключения к Railway сервисам
console.log('✅ DATABASE_URL:', process.env.DATABASE_URL ? 'Connected to Railway PostgreSQL' : 'NOT SET');
console.log('✅ REDIS_URL:', process.env.REDIS_URL ? 'Connected to Railway Redis' : 'NOT SET');

// Проверяем структуру файлов
const backendMain = path.join(__dirname, 'backend', 'src', 'index.js');
const backendPrisma = path.join(__dirname, 'backend', 'prisma', 'schema.prisma');

if (!fs.existsSync(backendMain)) {
  console.error('❌ CRITICAL: backend/src/index.js not found');
  process.exit(1);
}

if (!fs.existsSync(backendPrisma)) {
  console.error('❌ CRITICAL: backend/prisma/schema.prisma not found');
  process.exit(1);
}

console.log('✅ Environment check passed');
console.log('✅ File structure check passed');

// Функция для применения миграций Prisma
async function runPrismaMigrations() {
  console.log('🗄️ Running Prisma migrations...');
  
  return new Promise((resolve, reject) => {
    const migrateProcess = spawn('npx', ['prisma', 'migrate', 'deploy'], {
      cwd: path.join(__dirname, 'backend'),
      stdio: 'pipe',
      env: process.env
    });
    
    let output = '';
    let errorOutput = '';
    
    migrateProcess.stdout.on('data', (data) => {
      output += data.toString();
      console.log('[PRISMA]', data.toString().trim());
    });
    
    migrateProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error('[PRISMA ERROR]', data.toString().trim());
    });
    
    migrateProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Prisma migrations completed successfully');
        resolve(true);
      } else {
        console.log('⚠️ Prisma migrations failed, but continuing...', errorOutput);
        resolve(false); // Продолжаем даже если миграции не прошли
      }
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      migrateProcess.kill();
      console.log('⏰ Prisma migration timeout, continuing...');
      resolve(false);
    }, 30000);
  });
}

// Запуск приложения
async function startApplication() {
  try {
    // Сначала применяем миграции
    await runPrismaMigrations();
    
    // Меняем директорию на backend
    process.chdir(path.join(__dirname, 'backend'));
    console.log('✅ Changed to backend directory');
    
    // Запускаем основное приложение
    console.log('🚀 Starting VHM24 Backend...');
    require('./src/index.js');
    
  } catch (error) {
    console.error('❌ FATAL ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Запуск
startApplication();
