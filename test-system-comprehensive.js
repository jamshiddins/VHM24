const path = require('path');
const fs = require('fs');

// Установка правильного пути для Prisma
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:tcaqejEXLSdaUdMQXFqEDGBQvavWVbGy@metro.proxy.rlwy.net:36258/railway';

async function testSystemComponents() {
  console.log('🔍 VHM24 КОМПЛЕКСНОЕ ТЕСТИРОВАНИЕ СИСТЕМЫ\n');
  
  const results = {
    environment: false,
    database: false,
    redis: false,
    s3: false,
    backend: false,
    prisma: false,
    telegram: false,
    overall: false
  };
  
  // Test 1: Environment Variables
  console.log('1. 📋 Переменные окружения:');
  require('dotenv').config();
  
  const envVars = [
    'DATABASE_URL',
    'REDIS_URL', 
    'S3_BUCKET_NAME',
    'S3_ACCESS_KEY',
    'S3_SECRET_KEY',
    'JWT_SECRET',
    'TELEGRAM_BOT_TOKEN'
  ];
  
  let envCount = 0;
  envVars.forEach(varName => {
    const isSet = !!process.env[varName];
    const status = isSet ? '✅' : '❌';
    console.log(`   ${status} ${varName}: ${isSet ? 'Установлена' : 'Не установлена'}`);
    if (isSet) envCount++;
  });
  
  results.environment = envCount >= 6;
  console.log(`   📊 Готовность: ${envCount}/${envVars.length} (${Math.round(envCount/envVars.length*100)}%)\n`);
  
  // Test 2: Database Connection
  console.log('2. 🗄️ Подключение к базе данных:');
  try {
    // Используем правильный путь к Prisma клиенту
    const { PrismaClient } = require('./backend/node_modules/@prisma/client');
    const prisma = new PrismaClient({
      log: ['error'],
      errorFormat: 'minimal'
    });
    
    await Promise.race([
      prisma.$connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Таймаут подключения')), 15000))
    ]);
    
    console.log('   ✅ PostgreSQL подключение успешно');
    results.database = true;
    
    // Тест базовых таблиц
    try {
      const userCount = await prisma.user.count();
      const machineCount = await prisma.machine.count();
      const itemCount = await prisma.inventoryItem.count();
      
      console.log(`   📊 Пользователи: ${userCount}`);
      console.log(`   📊 Автоматы: ${machineCount}`);
      console.log(`   📊 Товары: ${itemCount}`);
      
      results.prisma = true;
    } catch (error) {
      console.log(`   ⚠️ Ошибка запроса к таблицам: ${error.message}`);
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.log(`   ❌ PostgreSQL подключение неудачно: ${error.message}`);
    results.database = false;
  }
  
  console.log('');
  
  // Test 3: Redis Connection
  console.log('3. 🔴 Redis подключение:');
  try {
    const Redis = require('ioredis');
    const redis = new Redis(process.env.REDIS_URL, {
      connectTimeout: 5000,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryDelayOnFailover: 100,
      showFriendlyErrorStack: false
    });
    
    await Promise.race([
      redis.ping(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Redis таймаут')), 5000))
    ]);
    
    console.log('   ✅ Redis подключение успешно');
    results.redis = true;
    await redis.disconnect();
  } catch (error) {
    console.log(`   ❌ Redis подключение неудачно: ${error.message}`);
    console.log('   💡 Для локальной разработки запустите: redis-server');
    results.redis = false;
  }
  
  console.log('');
  
  // Test 4: S3 Connection
  console.log('4. 📁 S3/DigitalOcean Spaces:');
  try {
    const { S3Service } = require('./backend/src/utils/s3');
    const result = await S3Service.testConnection();
    console.log(`   ${result ? '✅' : '❌'} S3 подключение ${result ? 'успешно' : 'неудачно'}`);
    results.s3 = result;
  } catch (error) {
    console.log(`   ❌ S3 подключение неудачно: ${error.message}`);
    results.s3 = false;
  }
  
  console.log('');
  
  // Test 5: Backend Server Files
  console.log('5. 🌐 Backend файлы:');
  const backendFiles = [
    'backend/src/index.js',
    'backend/src/routes',
    'backend/src/middleware',
    'backend/src/utils',
    'backend/prisma/schema.prisma'
  ];
  
  let backendCount = 0;
  backendFiles.forEach(file => {
    const exists = fs.existsSync(file);
    const status = exists ? '✅' : '❌';
    console.log(`   ${status} ${file}: ${exists ? 'Существует' : 'Отсутствует'}`);
    if (exists) backendCount++;
  });
  
  results.backend = backendCount === backendFiles.length;
  console.log(`   📊 Готовность: ${backendCount}/${backendFiles.length} (${Math.round(backendCount/backendFiles.length*100)}%)\n`);
  
  // Test 6: Telegram Bot
  console.log('6. 🤖 Telegram Bot:');
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN не установлен');
    }
    
    // Простая проверка формата токена
    const tokenParts = token.split(':');
    if (tokenParts.length !== 2 || tokenParts[0].length < 8) {
      throw new Error('Неверный формат токена');
    }
    
    console.log('   ✅ Токен Telegram бота корректен');
    console.log(`   📊 Bot ID: ${tokenParts[0]}`);
    results.telegram = true;
  } catch (error) {
    console.log(`   ❌ Telegram бот: ${error.message}`);
    results.telegram = false;
  }
  
  console.log('');
  
  // Overall Results
  console.log('🎯 ИТОГОВЫЕ РЕЗУЛЬТАТЫ:');
  console.log('=' .repeat(50));
  
  const components = [
    { name: 'Переменные окружения', status: results.environment, critical: true },
    { name: 'База данных PostgreSQL', status: results.database, critical: true },
    { name: 'Prisma ORM', status: results.prisma, critical: true },
    { name: 'Redis кеш', status: results.redis, critical: false },
    { name: 'S3 хранилище', status: results.s3, critical: false },
    { name: 'Backend файлы', status: results.backend, critical: true },
    { name: 'Telegram Bot', status: results.telegram, critical: true }
  ];
  
  let totalScore = 0;
  let criticalScore = 0;
  let criticalTotal = 0;
  
  components.forEach(comp => {
    const status = comp.status ? '✅' : '❌';
    const priority = comp.critical ? '[КРИТИЧНО]' : '[ОПЦИОНАЛЬНО]';
    console.log(`${status} ${comp.name} ${priority}`);
    
    if (comp.status) totalScore++;
    if (comp.critical) {
      criticalTotal++;
      if (comp.status) criticalScore++;
    }
  });
  
  const overallPercentage = Math.round((totalScore / components.length) * 100);
  const criticalPercentage = Math.round((criticalScore / criticalTotal) * 100);
  
  console.log('=' .repeat(50));
  console.log(`📊 ОБЩАЯ ГОТОВНОСТЬ: ${totalScore}/${components.length} (${overallPercentage}%)`);
  console.log(`🔥 КРИТИЧНЫЕ КОМПОНЕНТЫ: ${criticalScore}/${criticalTotal} (${criticalPercentage}%)`);
  
  results.overall = criticalScore >= criticalTotal;
  
  if (results.overall) {
    console.log('\n🎉 СИСТЕМА ГОТОВА К ЗАПУСКУ!');
    console.log('💡 Рекомендуемые команды:');
    console.log('   cd backend && npm start  # Запуск backend');
    console.log('   cd apps/telegram-bot && npm start  # Запуск бота');
  } else {
    console.log('\n⚠️ СИСТЕМА НЕ ГОТОВА К ЗАПУСКУ');
    console.log('🔧 Необходимо исправить критичные проблемы:');
    
    components.forEach(comp => {
      if (comp.critical && !comp.status) {
        console.log(`   ❌ ${comp.name}`);
      }
    });
  }
  
  console.log('\n📋 СЛЕДУЮЩИЕ ШАГИ:');
  if (!results.redis) {
    console.log('   1. Запустить Redis: redis-server (или использовать Railway Redis)');
  }
  if (!results.database) {
    console.log('   2. Проверить DATABASE_URL и доступность базы данных');
  }
  if (!results.telegram) {
    console.log('   3. Получить корректный токен от @BotFather');
  }
  
  return results;
}

// Запуск тестов
if (require.main === module) {
  testSystemComponents()
    .then(results => {
      process.exit(results.overall ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Критическая ошибка тестирования:', error);
      process.exit(1);
    });
}

module.exports = { testSystemComponents };
