/**
 * VHM24 - VendHub Manager 24/7
 * Скрипт для автоматического запуска всех сервисов
 * 
 * Использование:
 * node start-services.js
 * 
 * Опции:
 * --production: запуск в production режиме
 * --monolith: запуск в монолитном режиме (все сервисы в одном процессе)
 * --gateway-only: запуск только API Gateway
 * --with-monitoring: запуск с мониторингом
 */

require('dotenv').config();
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Конфигурация
const config = {
  production: process.argv.includes('--production'),
  monolith: process.argv.includes('--monolith'),
  gatewayOnly: process.argv.includes('--gateway-only'),
  withMonitoring: process.argv.includes('--with-monitoring'),
  services: [
    { name: 'gateway', port: process.env.GATEWAY_PORT || 8000, script: 'services/gateway/src/index.js' },
    { name: 'auth', port: process.env.AUTH_PORT || 3001, script: 'services/auth/src/index.js' },
    { name: 'machines', port: process.env.MACHINES_PORT || 3002, script: 'services/machines/src/index.js' },
    { name: 'inventory', port: process.env.INVENTORY_PORT || 3003, script: 'services/inventory/src/index.js' },
    { name: 'tasks', port: process.env.TASKS_PORT || 3004, script: 'services/tasks/src/index.js' },
    { name: 'bunkers', port: process.env.BUNKERS_PORT || 3005, script: 'services/bunkers/src/index.js' },
    { name: 'backup', port: process.env.BACKUP_PORT || 3007, script: 'services/backup/src/index.js' },
    { name: 'telegram-bot', port: null, script: 'services/telegram-bot/src/index.js' }
  ]
};

// Проверка наличия Prisma схемы
const schemaPath = path.join(__dirname, 'packages/database/prisma/schema.prisma');
if (!fs.existsSync(schemaPath)) {
  console.error('❌ Prisma schema not found at packages/database/prisma/schema.prisma');
  process.exit(1);
}

// Проверка наличия .env файла
if (!fs.existsSync(path.join(__dirname, '.env'))) {
  console.error('❌ .env file not found. Please create it based on .env.example');
  process.exit(1);
}

// Проверка соединения с базой данных
async function checkDatabase() {
  console.log('🔍 Checking database connection...');
  
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    await prisma.$connect();
    console.log('✅ Database connection successful');
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Проверка соединения с Redis
async function checkRedis() {
  if (!process.env.REDIS_URL) {
    console.log('⚠️ REDIS_URL not set, skipping Redis check');
    return true;
  }
  
  console.log('🔍 Checking Redis connection...');
  
  return new Promise((resolve) => {
    exec('npx redis-cli -u ' + process.env.REDIS_URL + ' ping', (error, stdout) => {
      if (error || !stdout.includes('PONG')) {
        console.error('❌ Redis connection failed:', error?.message || 'No PONG response');
        resolve(false);
      } else {
        console.log('✅ Redis connection successful');
        resolve(true);
      }
    });
  });
}

// Генерация Prisma клиента
async function generatePrismaClient() {
  console.log('🔧 Generating Prisma client...');
  
  return new Promise((resolve, reject) => {
    exec('npx prisma generate --schema=' + schemaPath, (error, stdout) => {
      if (error) {
        console.error('❌ Prisma client generation failed:', error.message);
        reject(error);
      } else {
        console.log('✅ Prisma client generated successfully');
        resolve();
      }
    });
  });
}

// Запуск миграций
async function runMigrations() {
  if (config.production) {
    console.log('🔧 Running Prisma migrations in production mode...');
    
    return new Promise((resolve, reject) => {
      exec('npx prisma migrate deploy --schema=' + schemaPath, (error, stdout) => {
        if (error) {
          console.error('❌ Prisma migrations failed:', error.message);
          reject(error);
        } else {
          console.log('✅ Prisma migrations applied successfully');
          resolve();
        }
      });
    });
  } else {
    console.log('⏩ Skipping migrations in development mode');
    return Promise.resolve();
  }
}

// Запуск сервиса
function startService(service) {
  console.log(`🚀 Starting ${service.name} service...`);
  
  const env = {
    ...process.env,
    PORT: service.port,
    SERVICE_NAME: service.name,
    NODE_ENV: config.production ? 'production' : 'development'
  };
  
  const child = spawn('node', [service.script], {
    env,
    stdio: 'pipe',
    detached: false
  });
  
  child.stdout.on('data', (data) => {
    console.log(`[${service.name}] ${data.toString().trim()}`);
  });
  
  child.stderr.on('data', (data) => {
    console.error(`[${service.name}] ${data.toString().trim()}`);
  });
  
  child.on('close', (code) => {
    if (code !== 0) {
      console.error(`❌ ${service.name} service exited with code ${code}`);
    }
  });
  
  return child;
}

// Запуск всех сервисов
async function startAllServices() {
  const children = [];
  
  if (config.monolith) {
    console.log('🚀 Starting in monolith mode...');
    
    const child = spawn('node', ['start-monolith.js'], {
      env: {
        ...process.env,
        NODE_ENV: config.production ? 'production' : 'development'
      },
      stdio: 'inherit',
      detached: false
    });
    
    children.push(child);
  } else if (config.gatewayOnly) {
    console.log('🚀 Starting gateway only...');
    
    const gateway = config.services.find(s => s.name === 'gateway');
    children.push(startService(gateway));
  } else {
    // Запускаем все сервисы
    for (const service of config.services) {
      children.push(startService(service));
      
      // Небольшая задержка между запусками сервисов
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Запуск мониторинга
  if (config.withMonitoring) {
    console.log('🔍 Starting monitoring service...');
    
    const child = spawn('node', ['services/monitoring/src/index.js'], {
      env: {
        ...process.env,
        NODE_ENV: config.production ? 'production' : 'development'
      },
      stdio: 'pipe',
      detached: false
    });
    
    child.stdout.on('data', (data) => {
      console.log(`[monitoring] ${data.toString().trim()}`);
    });
    
    child.stderr.on('data', (data) => {
      console.error(`[monitoring] ${data.toString().trim()}`);
    });
    
    children.push(child);
  }
  
  // Обработка сигналов завершения
  process.on('SIGINT', () => {
    console.log('👋 Shutting down all services...');
    
    for (const child of children) {
      process.kill(-child.pid);
    }
    
    process.exit(0);
  });
  
  console.log(`
✅ All services started successfully!
🌐 API Gateway running at http://localhost:${process.env.GATEWAY_PORT || 8000}
📊 Health check available at http://localhost:${process.env.GATEWAY_PORT || 8000}/health
📱 Telegram bot is running
  `);
}

// Главная функция
async function main() {
  console.log(`
🚀 VHM24 - VendHub Manager 24/7
⏰ Starting services in ${config.production ? 'production' : 'development'} mode
🖥️ Platform: ${os.platform()} ${os.release()}
  `);
  
  try {
    // Проверка соединений
    const dbOk = await checkDatabase();
    const redisOk = await checkRedis();
    
    if (!dbOk) {
      console.error('❌ Cannot start services without database connection');
      process.exit(1);
    }
    
    if (!redisOk && config.production) {
      console.error('❌ Cannot start services without Redis connection in production mode');
      process.exit(1);
    }
    
    // Генерация Prisma клиента
    await generatePrismaClient();
    
    // Запуск миграций
    await runMigrations();
    
    // Запуск сервисов
    await startAllServices();
  } catch (error) {
    console.error('❌ Failed to start services:', error.message);
    process.exit(1);
  }
}

// Запуск
main();
