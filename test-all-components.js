#!/usr/bin/env node

require('dotenv').config();
const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 VHM24 - Тестирование всех компонентов\n');

// Проверка переменных окружения
function checkEnvironment() {
  console.log('📋 Проверка переменных окружения...\n');
  
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'REDIS_URL',
    'TELEGRAM_BOT_TOKEN',
    'S3_ACCESS_KEY',
    'S3_SECRET_KEY'
  ];
  
  let allPresent = true;
  
  required.forEach(key => {
    if (process.env[key]) {
      console.log(`✅ ${key}: ${key.includes('SECRET') || key.includes('KEY') ? '***' : process.env[key].substring(0, 30) + '...'}`);
    } else {
      console.log(`❌ ${key}: НЕ УСТАНОВЛЕН`);
      allPresent = false;
    }
  });
  
  return allPresent;
}

// Проверка подключения к базе данных
async function testDatabase() {
  console.log('\n🗄️  Проверка подключения к PostgreSQL...');
  
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT 1`;
    console.log('✅ База данных подключена успешно');
    
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.log('❌ Ошибка подключения к базе данных:', error.message);
    return false;
  }
}

// Тест Web Dashboard
async function testWebDashboard() {
  console.log('\n🌐 Проверка Web Dashboard...');
  
  return new Promise((resolve) => {
    const dashboard = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, 'apps/web-dashboard'),
      shell: true
    });
    
    let started = false;
    
    dashboard.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Ready') && !started) {
        started = true;
        console.log('✅ Web Dashboard запущен на http://localhost:3000');
        dashboard.kill();
        resolve(true);
      }
    });
    
    dashboard.stderr.on('data', (data) => {
      const error = data.toString();
      if (error && !error.includes('ExperimentalWarning')) {
        console.log('⚠️  Dashboard предупреждение:', error.substring(0, 100));
      }
    });
    
    setTimeout(() => {
      if (!started) {
        console.log('❌ Web Dashboard не запустился за 30 секунд');
        dashboard.kill();
        resolve(false);
      }
    }, 30000);
  });
}

// Тест сервисов
async function testService(name, port, servicePath) {
  console.log(`\n🔧 Тестирование ${name} сервиса...`);
  
  return new Promise((resolve) => {
    const service = spawn('npm', ['start'], {
      cwd: path.join(__dirname, servicePath),
      shell: true,
      env: { ...process.env, PORT: port }
    });
    
    let started = false;
    let error = false;
    
    service.stdout.on('data', (data) => {
      const output = data.toString();
      if ((output.includes('running') || output.includes('started')) && !started) {
        started = true;
        console.log(`✅ ${name} сервис запущен на порту ${port}`);
        service.kill();
        resolve(true);
      }
    });
    
    service.stderr.on('data', (data) => {
      const errorMsg = data.toString();
      if (errorMsg.includes('Error') && !error) {
        error = true;
        console.log(`❌ ${name} сервис ошибка:`, errorMsg.substring(0, 200));
        service.kill();
        resolve(false);
      }
    });
    
    setTimeout(() => {
      if (!started && !error) {
        console.log(`⚠️  ${name} сервис не дал ответа за 10 секунд`);
        service.kill();
        resolve(false);
      }
    }, 10000);
  });
}

// Главная функция тестирования
async function runTests() {
  console.log('🚀 Начинаем полное тестирование проекта VHM24...\n');
  
  const results = {
    environment: false,
    database: false,
    dashboard: false,
    services: {}
  };
  
  // 1. Проверка окружения
  results.environment = checkEnvironment();
  
  // 2. Проверка базы данных
  if (results.environment) {
    results.database = await testDatabase();
  }
  
  // 3. Тест Web Dashboard
  results.dashboard = await testWebDashboard();
  
  // 4. Тест основных сервисов
  const servicesToTest = [
    { name: 'Auth', port: 3001, path: 'services/auth' },
    { name: 'Gateway', port: 8000, path: 'services/gateway' },
    { name: 'Notifications', port: 3008, path: 'services/notifications' }
  ];
  
  for (const service of servicesToTest) {
    results.services[service.name] = await testService(service.name, service.port, service.path);
  }
  
  // Итоговый отчет
  console.log('\n' + '='.repeat(60));
  console.log('📊 ИТОГОВЫЙ ОТЧЕТ ТЕСТИРОВАНИЯ');
  console.log('='.repeat(60) + '\n');
  
  console.log('Переменные окружения:', results.environment ? '✅ ОК' : '❌ ОШИБКА');
  console.log('База данных:', results.database ? '✅ Подключена' : '❌ Недоступна');
  console.log('Web Dashboard:', results.dashboard ? '✅ Работает' : '❌ Ошибка');
  
  console.log('\nСервисы:');
  Object.entries(results.services).forEach(([name, status]) => {
    console.log(`  ${name}:`, status ? '✅ Работает' : '❌ Ошибка');
  });
  
  // Рекомендации
  console.log('\n📝 РЕКОМЕНДАЦИИ:');
  
  if (!results.environment) {
    console.log('- Проверьте .env файл и убедитесь, что все переменные установлены');
  }
  
  if (!results.database) {
    console.log('- Проверьте DATABASE_URL и доступность PostgreSQL');
    console.log('- Попробуйте получить публичный URL из Railway Dashboard');
  }
  
  if (!results.dashboard) {
    console.log('- Проверьте зависимости Web Dashboard: cd apps/web-dashboard && npm install');
  }
  
  const failedServices = Object.entries(results.services)
    .filter(([_, status]) => !status)
    .map(([name]) => name);
    
  if (failedServices.length > 0) {
    console.log(`- Сервисы с ошибками: ${failedServices.join(', ')}`);
    console.log('- Запустите: node fix-backend-services.js');
  }
  
  // Финальный вердикт
  const allOk = results.environment && results.database && results.dashboard && 
                Object.values(results.services).every(status => status);
  
  console.log('\n' + '='.repeat(60));
  if (allOk) {
    console.log('🎉 ВСЕ КОМПОНЕНТЫ РАБОТАЮТ КОРРЕКТНО!');
    console.log('Проект готов к запуску: node start-with-railway.js');
  } else {
    console.log('⚠️  ТРЕБУЕТСЯ ИСПРАВЛЕНИЕ ОШИБОК');
    console.log('Следуйте рекомендациям выше для устранения проблем');
  }
  console.log('='.repeat(60));
}

// Запуск тестов
runTests().catch(error => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
});
