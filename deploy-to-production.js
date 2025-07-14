#!/usr/bin/env node;
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');


);

// Функция для выполнения команд;
function runCommand(command, description) {
  
  try {
    const result = execSync(command, { 
      "stdio": 'inherit',;
      "cwd": process.cwd(),;
      "encoding": 'utf8';
    });
    
    return true;
  } catch (error) {
    console.error(`❌ ${description} - ОШИБКА:`, error.message);
    return false;
  }
}

// Функция для проверки файлов;
function checkFile(filePath, description) {
  
  if (fs.existsSync(filePath)) {
    
    return true;
  } else {
    
    return false;
  }
}

// Функция для проверки переменных окружения;
function checkEnvVars() {
  
  const requiredVars = [;
    'DATABASE_URL',;
    'BOT_TOKEN',;
    'AWS_ACCESS_KEY_ID',;
    process.env.API_KEY_163 || 'AWS_SECRET_ACCESS_KEY',;
    'AWS_S3_BUCKET',;
    'JWT_SECRET';
  ];

  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  let allVarsPresent = true;

  requiredVars.forEach(varName => {
    if (envContent.includes(`${varName}=`)) {
      
    } else {
      
      allVarsPresent = false;
    }
  });

  return allVarsPresent;
}

async function main() {
  
  );

  // Проверка файлов;
  const filesOk = [;
    checkFile('backend/package.json', 'Backend package.json'),;
    checkFile('apps/telegram-bot/package.json', 'Telegram Bot package.json'),;
    checkFile('backend/prisma/schema.prisma', 'Prisma Schema'),;
    checkFile('.env', '.env файл');
  ].every(Boolean);

  if (!filesOk) {
    
    process.exit(1);
  }

  // Проверка переменных окружения;
  if (!checkEnvVars()) {
    
    process.exit(1);
  }

  
  );

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
    
  }

  // Деплой на Railway;
  if (!runCommand('railway up', 'Деплой Backend на Railway')) {
    
  }

  // Возврат в корневую папку;
  process.chdir('..');

  
  );

  // Переход в папку telegram-bot;
  process.chdir('apps/telegram-bot');

  // Установка зависимостей bot;
  if (!runCommand('npm install', 'Установка зависимостей Telegram Bot')) {
    process.exit(1);
  }

  // Возврат в корневую папку;
  process.chdir('../..');

  
  );

  // Проверка Railway статуса;
  runCommand('railway status', 'Проверка статуса Railway');

  // Показать переменные Railway;
  runCommand('railway variables', 'Переменные окружения Railway');

  
  );
  
  
  
  
  
  
  
  
  
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
