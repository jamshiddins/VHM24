/**
 * VHM24 Platform - Railway Production Start
 * Single process mode for Railway deployment
 */

// Не загружаем .env на Railway
if (!process.env.RAILWAY_ENVIRONMENT) {
  require('dotenv').config();
}

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 VHM24 Platform starting on Railway...');
console.log('Environment:', process.env.RAILWAY_ENVIRONMENT || 'development');
console.log('Port:', process.env.PORT || 8000);

// Проверяем критичные переменные
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('Please set them in Railway dashboard');
  
  // Запускаем Gateway в режиме без БД
  console.log('⚠️  Starting in limited mode (Gateway only, no database)...');
}

// Функция для запуска сервиса в том же процессе
function startServiceInProcess(servicePath, serviceName) {
  try {
    console.log(`Starting ${serviceName}...`);
    require(servicePath);
    console.log(`✅ ${serviceName} started`);
  } catch (error) {
    console.error(`❌ Failed to start ${serviceName}:`, error.message);
  }
}

// Запускаем сервисы последовательно в одном процессе
async function startAll() {
  // Небольшая задержка для инициализации
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Gateway должен быть последним, так как он слушает основной порт
  const services = [
    { path: './services/auth/src/index.js', name: 'Auth Service' },
    { path: './services/machines/src/index.js', name: 'Machines Service' },
    { path: './services/inventory/src/index.js', name: 'Inventory Service' },
    { path: './services/tasks/src/index.js', name: 'Tasks Service' },
    { path: './services/bunkers/src/index.js', name: 'Bunkers Service' }
  ];
  
  // Запускаем микросервисы
  for (const service of services) {
    startServiceInProcess(service.path, service.name);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Запускаем Telegram Bot если есть токен
  if (process.env.TELEGRAM_BOT_TOKEN) {
    startServiceInProcess('./services/telegram-bot/src/index.js', 'Telegram Bot');
  }
  
  // Gateway запускаем последним
  console.log('Starting Gateway (main service)...');
  require('./services/gateway/src/index.js');
  
  console.log('\n✅ All services started!');
  console.log('\n📍 Access your API at:');
  console.log(`${process.env.RAILWAY_STATIC_URL || 'http://localhost:' + (process.env.PORT || 8000)}`);
}

// Обработка ошибок
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Запускаем все сервисы
startAll().catch(error => {
  console.error('Failed to start services:', error);
  process.exit(1);
});
