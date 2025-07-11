/**
 * VHM24 - VendHub Manager 24/7
 * Скрипт для проверки работоспособности системы
 *
 * Использование:
 * node scripts/check-system.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Конфигурация
const config = {
  services: [
    {
      name: 'gateway',
      port: process.env.GATEWAY_PORT || 8000,
      path: 'services/gateway/src/index.js'
    },
    {
      name: 'auth',
      port: process.env.AUTH_PORT || 3001,
      path: 'services/auth/src/index.js'
    },
    {
      name: 'machines',
      port: process.env.MACHINES_PORT || 3002,
      path: 'services/machines/src/index.js'
    },
    {
      name: 'inventory',
      port: process.env.INVENTORY_PORT || 3003,
      path: 'services/inventory/src/index.js'
    },
    {
      name: 'tasks',
      port: process.env.TASKS_PORT || 3004,
      path: 'services/tasks/src/index.js'
    },
    {
      name: 'bunkers',
      port: process.env.BUNKERS_PORT || 3005,
      path: 'services/bunkers/src/index.js'
    },
    {
      name: 'backup',
      port: process.env.BACKUP_PORT || 3007,
      path: 'services/backup/src/index.js'
    },
    {
      name: 'telegram-bot',
      port: null,
      path: 'services/telegram-bot/src/index.js'
    }
  ],
  requiredEnvVars: [
    'JWT_SECRET',
    'DATABASE_URL',
    'REDIS_URL',
    'TELEGRAM_BOT_TOKEN',
    'ADMIN_IDS'
  ],
  schemaPath: 'packages/database/prisma/schema.prisma'
};

// Проверка наличия файлов сервисов
function checkServiceFiles() {
  console.log('🔍 Проверка наличия файлов сервисов...');

  const results = [];

  for (const service of config.services) {
    const filePath = path.join(process.cwd(), service.path);
    const exists = fs.existsSync(filePath);

    results.push({
      name: service.name,
      path: service.path,
      exists
    });

    console.log(`${exists ? '✅' : '❌'} ${service.name}: ${service.path}`);
  }

  const allExist = results.every(result => result.exists);

  if (allExist) {
    console.log('✅ Все файлы сервисов найдены');
  } else {
    console.error('❌ Некоторые файлы сервисов не найдены');
  }

  return allExist;
}

// Проверка наличия переменных окружения
function checkEnvironmentVariables() {
  console.log('🔍 Проверка переменных окружения...');

  const results = [];

  for (const envVar of config.requiredEnvVars) {
    const exists = !!process.env[envVar];

    results.push({
      name: envVar,
      exists
    });

    console.log(`${exists ? '✅' : '❌'} ${envVar}`);
  }

  const allExist = results.every(result => result.exists);

  if (allExist) {
    console.log('✅ Все необходимые переменные окружения найдены');
  } else {
    console.error('❌ Некоторые переменные окружения отсутствуют');
  }

  return allExist;
}

// Проверка соединения с базой данных
function checkDatabaseUrl() {
  console.log('🔍 Проверка URL базы данных...');

  try {
    const dbUrl = new URL(process.env.DATABASE_URL);

    console.log(
      `✅ URL базы данных корректен: ${dbUrl.protocol}//${dbUrl.host}`
    );
    return true;
  } catch (error) {
    console.error('❌ Некорректный URL базы данных:', error.message);
    return false;
  }
}

// Проверка соединения с Redis
function checkRedisUrl() {
  console.log('🔍 Проверка URL Redis...');

  try {
    const redisUrl = new URL(process.env.REDIS_URL);

    console.log(
      `✅ URL Redis корректен: ${redisUrl.protocol}//${redisUrl.host}`
    );
    return true;
  } catch (error) {
    console.error('❌ Некорректный URL Redis:', error.message);
    return false;
  }
}

// Проверка наличия Prisma схемы
function checkPrismaSchema() {
  console.log('🔍 Проверка наличия Prisma схемы...');

  const schemaPath = path.join(process.cwd(), config.schemaPath);
  const exists = fs.existsSync(schemaPath);

  if (exists) {
    console.log(`✅ Prisma схема найдена: ${config.schemaPath}`);
  } else {
    console.error(`❌ Prisma схема не найдена: ${config.schemaPath}`);
  }

  return exists;
}

// Проверка наличия директории для бэкапов
function checkBackupDirectory() {
  console.log('🔍 Проверка наличия директории для бэкапов...');

  const backupDir = path.join(process.cwd(), 'backups');
  let exists = fs.existsSync(backupDir);

  if (!exists) {
    try {
      fs.mkdirSync(backupDir, { recursive: true });
      exists = true;
      console.log('✅ Директория для бэкапов создана');
    } catch (error) {
      console.error(
        '❌ Не удалось создать директорию для бэкапов:',
        error.message
      );
    }
  } else {
    console.log('✅ Директория для бэкапов найдена');
  }

  return exists;
}

// Проверка наличия директории для загрузок
function checkUploadsDirectory() {
  console.log('🔍 Проверка наличия директории для загрузок...');

  const uploadsDir = path.join(process.cwd(), 'uploads');
  let exists = fs.existsSync(uploadsDir);

  if (!exists) {
    try {
      fs.mkdirSync(uploadsDir, { recursive: true });
      exists = true;
      console.log('✅ Директория для загрузок создана');
    } catch (error) {
      console.error(
        '❌ Не удалось создать директорию для загрузок:',
        error.message
      );
    }
  } else {
    console.log('✅ Директория для загрузок найдена');
  }

  return exists;
}

// Проверка наличия файла .env
function checkEnvFile() {
  console.log('🔍 Проверка наличия файла .env...');

  const envPath = path.join(process.cwd(), '.env');
  const exists = fs.existsSync(envPath);

  if (exists) {
    console.log('✅ Файл .env найден');
  } else {
    console.error('❌ Файл .env не найден');
  }

  return exists;
}

// Проверка наличия файла railway.toml
function checkRailwayConfig() {
  console.log('🔍 Проверка наличия файла railway.toml...');

  const railwayPath = path.join(process.cwd(), 'railway.toml');
  const exists = fs.existsSync(railwayPath);

  if (exists) {
    console.log('✅ Файл railway.toml найден');
  } else {
    console.error('❌ Файл railway.toml не найден');
  }

  return exists;
}

// Проверка наличия скриптов
function checkScripts() {
  console.log('🔍 Проверка наличия скриптов...');

  const scripts = [
    'start-services.js',
    'scripts/backup-database.js',
    'scripts/migrate-database.js',
    'scripts/check-system.js'
  ];

  const results = [];

  for (const script of scripts) {
    const scriptPath = path.join(process.cwd(), script);
    const exists = fs.existsSync(scriptPath);

    results.push({
      name: script,
      exists
    });

    console.log(`${exists ? '✅' : '❌'} ${script}`);
  }

  const allExist = results.every(result => result.exists);

  if (allExist) {
    console.log('✅ Все скрипты найдены');
  } else {
    console.error('❌ Некоторые скрипты не найдены');
  }

  return allExist;
}

// Проверка наличия документации
function checkDocumentation() {
  console.log('🔍 Проверка наличия документации...');

  const docs = [
    'MOBILE_APP_PLAN.md',
    'IMPLEMENTATION_REPORT.md',
    'DETAILED_IMPLEMENTATION_REPORT.md',
    'API_DOCUMENTATION.md',
    'CICD_SETUP.md',
    'MONITORING_SETUP.md'
  ];

  const results = [];

  for (const doc of docs) {
    const docPath = path.join(process.cwd(), doc);
    const exists = fs.existsSync(docPath);

    results.push({
      name: doc,
      exists
    });

    console.log(`${exists ? '✅' : '❌'} ${doc}`);
  }

  const allExist = results.every(result => result.exists);

  if (allExist) {
    console.log('✅ Вся документация найдена');
  } else {
    console.error('❌ Некоторая документация не найдена');
  }

  return allExist;
}

// Главная функция
function main() {
  console.log(`
🚀 VHM24 - Проверка работоспособности системы
⏰ Дата: ${new Date().toISOString()}
  `);

  const checks = [
    { name: 'Файлы сервисов', check: checkServiceFiles },
    { name: 'Переменные окружения', check: checkEnvironmentVariables },
    { name: 'URL базы данных', check: checkDatabaseUrl },
    { name: 'URL Redis', check: checkRedisUrl },
    { name: 'Prisma схема', check: checkPrismaSchema },
    { name: 'Директория для бэкапов', check: checkBackupDirectory },
    { name: 'Директория для загрузок', check: checkUploadsDirectory },
    { name: 'Файл .env', check: checkEnvFile },
    { name: 'Файл railway.toml', check: checkRailwayConfig },
    { name: 'Скрипты', check: checkScripts },
    { name: 'Документация', check: checkDocumentation }
  ];

  const results = [];

  for (const { name, check } of checks) {
    console.log(`\n📋 Проверка: ${name}`);
    const result = check();
    results.push({ name, result });
    console.log();
  }

  const successCount = results.filter(r => r.result).length;
  const totalCount = results.length;
  const successRate = Math.round((successCount / totalCount) * 100);

  console.log(`
📊 Результаты проверки:
✅ Успешно: ${successCount}/${totalCount} (${successRate}%)
  `);

  if (successRate === 100) {
    console.log('🎉 Система полностью готова к деплою!');
  } else if (successRate >= 80) {
    console.log(
      '🔔 Система в целом готова к деплою, но есть некоторые проблемы.'
    );
  } else {
    console.log(
      '⚠️ Система не готова к деплою. Необходимо исправить проблемы.'
    );
  }
}

// Запуск
main();
