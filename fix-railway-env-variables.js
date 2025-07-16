/**
 * Скрипт для проверки и исправления переменных окружения в Railway
 * Этот скрипт проверяет наличие всех необходимых переменных окружения
 * и исправляет их при необходимости
 */
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');

// Загружаем .env.development файл для локальной разработки
const devEnv = dotenv.config({ path: '.env.development' });
dotenvExpand.expand(devEnv);

// Загружаем основной .env файл
const mainEnv = dotenv.config();
dotenvExpand.expand(mainEnv);
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Функция для логирования
function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const colors = {
    INFO: '\x1b[36m',    // Голубой
    SUCCESS: '\x1b[32m', // Зеленый
    WARNING: '\x1b[33m', // Желтый
    ERROR: '\x1b[31m',   // Красный
    RESET: '\x1b[0m'     // Сброс цвета
  };
  
  console.log(`${colors[type]}[${timestamp}] [${type}] ${message}${colors.RESET}`);
}

// Функция для проверки наличия переменной окружения
function checkEnvVariable(name) {
  if (!process.env[name]) {
    log(`Переменная окружения ${name} не настроена`, 'ERROR');
    return false;
  }
  
  log(`Переменная окружения ${name} настроена: ${name === 'DATABASE_URL' || name === 'REDIS_URL' ? process.env[name].substring(0, 20) + '...' : process.env[name]}`, 'SUCCESS');
  return true;
}

// Функция для проверки наличия всех необходимых переменных окружения
function checkAllEnvVariables() {
  log('Проверка переменных окружения...');
  
  const requiredVars = [
    'DATABASE_URL',
    'REDIS_URL',
    'NODE_ENV',
    'PORT',
    'RAILWAY_PROJECT_ID',
    'RAILWAY_PUBLIC_URL'
  ];
  
  const missingVars = [];
  
  for (const varName of requiredVars) {
    if (!checkEnvVariable(varName)) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    log(`Отсутствуют переменные окружения: ${missingVars.join(', ')}`, 'ERROR');
    return missingVars;
  }
  
  log('Все необходимые переменные окружения настроены', 'SUCCESS');
  return [];
}

// Функция для исправления переменных окружения
function fixEnvVariables(missingVars) {
  log('Исправление переменных окружения...');
  
  // Проверка наличия файла .env
  if (!fs.existsSync('.env')) {
    log('Файл .env не найден, создание нового файла', 'INFO');
    fs.writeFileSync('.env', '');
  }
  
  // Чтение файла .env
  let envContent = fs.readFileSync('.env', 'utf8');
  
  // Добавление отсутствующих переменных окружения
  for (const varName of missingVars) {
    if (varName === 'DATABASE_URL' && !envContent.includes('DATABASE_URL=')) {
      log('Добавление переменной окружения DATABASE_URL', 'INFO');
      envContent += `\nDATABASE_URL=postgresql://postgres:TnKaHJbWffrqtZOIklgKNSlNZHDcxsQh@postgres.railway.internal:5432/railway\n`;
    }
    
    if (varName === 'REDIS_URL' && !envContent.includes('REDIS_URL=')) {
      log('Добавление переменной окружения REDIS_URL', 'INFO');
      envContent += `\nREDIS_URL=redis://default:AlBzXGfakMRiVrFolnlZITTgniXFVBPX@yamanote.proxy.rlwy.net:21211\n`;
    }
    
    if (varName === 'NODE_ENV' && !envContent.includes('NODE_ENV=')) {
      log('Добавление переменной окружения NODE_ENV', 'INFO');
      envContent += `\nNODE_ENV=production\n`;
    }
    
    if (varName === 'PORT' && !envContent.includes('PORT=')) {
      log('Добавление переменной окружения PORT', 'INFO');
      envContent += `\nPORT=3000\n`;
    }
  }
  
  // Запись обновленного файла .env
  fs.writeFileSync('.env', envContent);
  log('Файл .env успешно обновлен', 'SUCCESS');
  
  // Обновление переменных окружения в Railway
  try {
    log('Обновление переменных окружения в Railway...', 'INFO');
    
    // Проверка наличия Railway CLI
    try {
      execSync('railway --version', { stdio: 'ignore' });
    } catch (error) {
      log('Railway CLI не установлен, установка...', 'INFO');
      execSync('npm install -g @railway/cli', { stdio: 'inherit' });
    }
    
    // Проверка авторизации в Railway
    try {
      execSync('railway whoami', { stdio: 'ignore' });
    } catch (error) {
      log('Необходимо авторизоваться в Railway', 'WARNING');
      log('Запустите команду: railway login', 'INFO');
      return false;
    }
    
    // Обновление переменных окружения в Railway
    for (const varName of missingVars) {
      if (process.env[varName]) {
        log(`Обновление переменной окружения ${varName} в Railway`, 'INFO');
        execSync(`railway variables set ${varName}="${process.env[varName]}"`, { stdio: 'inherit' });
      }
    }
    
    log('Переменные окружения в Railway успешно обновлены', 'SUCCESS');
    return true;
  } catch (error) {
    log(`Ошибка при обновлении переменных окружения в Railway: ${error.message}`, 'ERROR');
    return false;
  }
}

// Функция для проверки наличия Prisma
function checkPrisma() {
  log('Проверка наличия Prisma...');
  
  // Проверка наличия файла schema.prisma
  const schemaPath = path.join(__dirname, 'backend', 'prisma', 'schema.prisma');
  if (!fs.existsSync(schemaPath)) {
    log(`Файл schema.prisma не найден по пути ${schemaPath}`, 'ERROR');
    return false;
  }
  
  log('Файл schema.prisma найден', 'SUCCESS');
  
  // Чтение файла schema.prisma
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  // Проверка наличия переменной окружения DATABASE_URL
  if (!schemaContent.includes('env("DATABASE_URL")')) {
    log('В файле schema.prisma не используется переменная окружения DATABASE_URL', 'ERROR');
    return false;
  }
  
  log('В файле schema.prisma используется переменная окружения DATABASE_URL', 'SUCCESS');
  
  // Проверка наличия Prisma Client
  try {
    log('Проверка наличия Prisma Client...', 'INFO');
    execSync('npx prisma --version', { stdio: 'ignore' });
    log('Prisma Client установлен', 'SUCCESS');
    return true;
  } catch (error) {
    log('Prisma Client не установлен', 'ERROR');
    return false;
  }
}

// Функция для генерации Prisma Client
function generatePrismaClient() {
  log('Генерация Prisma Client...');
  
  try {
    execSync('cd backend && npx prisma generate', { stdio: 'inherit' });
    log('Prisma Client успешно сгенерирован', 'SUCCESS');
    return true;
  } catch (error) {
    log(`Ошибка при генерации Prisma Client: ${error.message}`, 'ERROR');
    return false;
  }
}

// Функция для проверки подключения к базе данных
async function testDatabaseConnection() {
  log('Проверка подключения к базе данных...');
  
  // Проверка наличия переменной окружения DATABASE_URL
  if (!process.env.DATABASE_URL) {
    log('DATABASE_URL не настроен в переменных окружения', 'ERROR');
    return false;
  }
  
  try {
    // Проверка подключения к базе данных
    execSync('cd backend && npx prisma db pull', { stdio: 'inherit' });
    log('Подключение к базе данных успешно', 'SUCCESS');
    return true;
  } catch (error) {
    log(`Ошибка подключения к базе данных: ${error.message}`, 'ERROR');
    return false;
  }
}

// Функция для деплоя в Railway
function deployToRailway() {
  log('Деплой в Railway...');
  
  try {
    execSync('railway up', { stdio: 'inherit' });
    log('Деплой в Railway успешно выполнен', 'SUCCESS');
    return true;
  } catch (error) {
    log(`Ошибка при деплое в Railway: ${error.message}`, 'ERROR');
    return false;
  }
}

// Главная функция
async function main() {
  log('Запуск проверки и исправления переменных окружения в Railway...');
  
  // Проверка переменных окружения
  const missingVars = checkAllEnvVariables();
  
  // Исправление переменных окружения
  if (missingVars.length > 0) {
    const isFixed = fixEnvVariables(missingVars);
    
    if (!isFixed) {
      log('Не удалось исправить переменные окружения', 'ERROR');
      return;
    }
  }
  
  // Проверка наличия Prisma
  const isPrismaOk = checkPrisma();
  
  if (!isPrismaOk) {
    log('Проблемы с Prisma', 'ERROR');
    return;
  }
  
  // Генерация Prisma Client
  const isClientGenerated = generatePrismaClient();
  
  if (!isClientGenerated) {
    log('Не удалось сгенерировать Prisma Client', 'ERROR');
    return;
  }
  
  // Проверка подключения к базе данных
  const isDatabaseConnected = await testDatabaseConnection();
  
  if (!isDatabaseConnected) {
    log('Не удалось подключиться к базе данных', 'ERROR');
    return;
  }
  
  // Деплой в Railway
  const isDeployed = deployToRailway();
  
  if (!isDeployed) {
    log('Не удалось выполнить деплой в Railway', 'ERROR');
    return;
  }
  
  log('Проверка и исправление переменных окружения в Railway завершены', 'SUCCESS');
}

// Запуск скрипта
main().catch(error => {
  log(`Критическая ошибка: ${error.message}`, 'ERROR');
  process.exit(1);
});
