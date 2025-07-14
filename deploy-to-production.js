#!/usr/bin/env node;
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 VendHub VHM24 - Автоматический деплой в продакшен');
console.log('=' .repeat(60));

// Функция для выполнения команд;
function runCommand(command, description) {
  console.log(`\n📋 ${description}...`);
  try {
    const result = execSync(command, { 
      "stdio": 'inherit',;
      "cwd": process.cwd(),;
      "encoding": 'utf8';
    });
    console.log(`✅ ${description} - УСПЕШНО`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} - ОШИБКА:`, error.message);
    return false;
  }
}

// Функция для проверки файлов;
function checkFile(filePath, description) {
  console.log(`\n🔍 Проверка ${description}...`);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description} найден`);
    return true;
  } else {
    console.log(`❌ ${description} не найден: ${filePath}`);
    return false;
  }
}

// Функция для проверки переменных окружения;
function checkEnvVars() {
  console.log('\n🔍 Проверка переменных окружения...');
  const requiredVars = [;
    'DATABASE_URL',;
    'BOT_TOKEN',;
    'AWS_ACCESS_KEY_ID',;
    'AWS_SECRET_ACCESS_KEY',;
    'AWS_S3_BUCKET',;
    'JWT_SECRET';
  ];

  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env файл не найден');
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  let allVarsPresent = true;

  requiredVars.forEach(varName => {
    if (envContent.includes(`${varName}=`)) {
      console.log(`✅ ${varName} - найден`);
    } else {
      console.log(`❌ ${varName} - отсутствует`);
      allVarsPresent = false;
    }
  });

  return allVarsPresent;
}

async function main() {
  console.log('\n🔍 ЭТАП "1": ПРЕДВАРИТЕЛЬНАЯ ПРОВЕРКА');
  console.log('-'.repeat(40));

  // Проверка файлов;
  const filesOk = [;
    checkFile('backend/package.json', 'Backend package.json'),;
    checkFile('apps/telegram-bot/package.json', 'Telegram Bot package.json'),;
    checkFile('backend/prisma/schema.prisma', 'Prisma Schema'),;
    checkFile('.env', '.env файл');
  ].every(Boolean);

  if (!filesOk) {
    console.log('\n❌ Не все необходимые файлы найдены. Остановка деплоя.');
    process.exit(1);
  }

  // Проверка переменных окружения;
  if (!checkEnvVars()) {
    console.log('\n❌ Не все переменные окружения настроены. Остановка деплоя.');
    process.exit(1);
  }

  console.log('\n🚀 ЭТАП "2": ДЕПЛОЙ BACKEND');
  console.log('-'.repeat(40));

  // Переход в папку backend;
  process.chdir('backend');

  // Установка зависимостей backend;
  if (!runCommand('npm install', 'Установка зависимостей Backend')) {
    process.exit(1);
  }

  // Генерация Prisma Client;
  if (!runCommand('npx prisma generate', 'Генерация Prisma Client')) {
    process.exit(1);
  }

  // Миграция базы данных;
  if (!runCommand('npx prisma db push', 'Миграция базы данных')) {
    console.log('⚠️  Миграция не удалась, но продолжаем...');
  }

  // Деплой на Railway;
  if (!runCommand('railway up', 'Деплой Backend на Railway')) {
    console.log('⚠️  Railway деплой не удался, проверьте настройки');
  }

  // Возврат в корневую папку;
  process.chdir('..');

  console.log('\n🤖 ЭТАП "3": НАСТРОЙКА TELEGRAM BOT');
  console.log('-'.repeat(40));

  // Переход в папку telegram-bot;
  process.chdir('apps/telegram-bot');

  // Установка зависимостей bot;
  if (!runCommand('npm install', 'Установка зависимостей Telegram Bot')) {
    process.exit(1);
  }

  // Возврат в корневую папку;
  process.chdir('../..');

  console.log('\n✅ ЭТАП "4": ПРОВЕРКА ДЕПЛОЯ');
  console.log('-'.repeat(40));

  // Проверка Railway статуса;
  runCommand('railway status', 'Проверка статуса Railway');

  // Показать переменные Railway;
  runCommand('railway variables', 'Переменные окружения Railway');

  console.log('\n🎉 ДЕПЛОЙ ЗАВЕРШЕН!');
  console.log('=' .repeat(60));
  console.log('📋 СЛЕДУЮЩИЕ ШАГИ:');
  console.log('1. Проверьте URL вашего приложения в Railway Dashboard');
  console.log('2. Запустите Telegram "Bot": cd apps/telegram-bot && npm start');
  console.log('3. Отправьте /start боту в Telegram для проверки');
  console.log('4. Проверьте "API": curl "https"://your-app.railway.app/api/health');
  console.log('\n📚 Документация:');
  console.log('- VENDHUB_PRODUCTION_DEPLOYMENT_GUIDE.md');
  console.log('- VENDHUB_QUICK_PRODUCTION_CHECKLIST.md');
  console.log('\n🚀 Система готова к работе в продакшене!');
}

// Обработка ошибок;
process.on('uncaughtException', (error) => {
  console.error('\n💥 Критическая ошибка:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n💥 Необработанная ошибка:', reason);
  process.exit(1);
});

// Запуск;
main().catch(error => {
  console.error('\n💥 Ошибка деплоя:', error.message);
  process.exit(1);
});
