/**
 * Скрипт для деплоя worker и scheduler в Railway
 * Проверяет наличие всех необходимых переменных окружения и файлов,
 * а затем выполняет деплой в Railway
 */
require('dotenv').config();
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

// Функция для проверки наличия файла
function checkFileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    log(`Ошибка при проверке файла ${filePath}: ${error.message}`, 'ERROR');
    return false;
  }
}

// Функция для проверки наличия переменных окружения
function checkEnvVariables() {
  log('Проверка переменных окружения...');
  
  const requiredVars = [
    'REDIS_URL',
    'DATABASE_URL',
    'NODE_ENV',
    'PORT'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    log(`Отсутствуют переменные окружения: ${missingVars.join(', ')}`, 'ERROR');
    return false;
  }
  
  log('Все необходимые переменные окружения настроены', 'SUCCESS');
  return true;
}

// Функция для проверки наличия необходимых файлов
function checkRequiredFiles() {
  log('Проверка необходимых файлов...');
  
  const requiredFiles = [
    'railway.json',
    'src/worker.js',
    'src/scheduler.js',
    'package.json'
  ];
  
  const missingFiles = requiredFiles.filter(file => !checkFileExists(file));
  
  if (missingFiles.length > 0) {
    log(`Отсутствуют необходимые файлы: ${missingFiles.join(', ')}`, 'ERROR');
    return false;
  }
  
  log('Все необходимые файлы найдены', 'SUCCESS');
  return true;
}

// Функция для проверки настроек в railway.json
function checkRailwayJson() {
  log('Проверка настроек в railway.json...');
  
  try {
    const railwayJson = JSON.parse(fs.readFileSync('railway.json', 'utf8'));
    
    // Проверка наличия секции services
    if (!railwayJson.services || !Array.isArray(railwayJson.services)) {
      log('В railway.json отсутствует секция services или она не является массивом', 'ERROR');
      return false;
    }
    
    // Проверка наличия сервисов web, worker и scheduler
    const serviceNames = railwayJson.services.map(service => service.name);
    const requiredServices = ['web', 'worker', 'scheduler'];
    const missingServices = requiredServices.filter(name => !serviceNames.includes(name));
    
    if (missingServices.length > 0) {
      log(`В railway.json отсутствуют сервисы: ${missingServices.join(', ')}`, 'ERROR');
      return false;
    }
    
    // Проверка команд запуска для worker и scheduler
    const workerService = railwayJson.services.find(service => service.name === 'worker');
    const schedulerService = railwayJson.services.find(service => service.name === 'scheduler');
    
    if (!workerService.startCommand || !workerService.startCommand.includes('start:worker')) {
      log('Неправильная команда запуска для сервиса worker', 'ERROR');
      return false;
    }
    
    if (!schedulerService.startCommand || !schedulerService.startCommand.includes('start:scheduler')) {
      log('Неправильная команда запуска для сервиса scheduler', 'ERROR');
      return false;
    }
    
    log('Настройки в railway.json корректны', 'SUCCESS');
    return true;
  } catch (error) {
    log(`Ошибка при проверке railway.json: ${error.message}`, 'ERROR');
    return false;
  }
}

// Функция для проверки скриптов в package.json
function checkPackageJson() {
  log('Проверка скриптов в package.json...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Проверка наличия скриптов start:worker и start:scheduler
    if (!packageJson.scripts || !packageJson.scripts['start:worker'] || !packageJson.scripts['start:scheduler']) {
      log('В package.json отсутствуют скрипты start:worker и/или start:scheduler', 'ERROR');
      return false;
    }
    
    // Проверка команд скриптов
    if (!packageJson.scripts['start:worker'].includes('src/worker.js')) {
      log('Неправильная команда для скрипта start:worker', 'ERROR');
      return false;
    }
    
    if (!packageJson.scripts['start:scheduler'].includes('src/scheduler.js')) {
      log('Неправильная команда для скрипта start:scheduler', 'ERROR');
      return false;
    }
    
    log('Скрипты в package.json корректны', 'SUCCESS');
    return true;
  } catch (error) {
    log(`Ошибка при проверке package.json: ${error.message}`, 'ERROR');
    return false;
  }
}

// Функция для деплоя в Railway
function deployToRailway() {
  log('Деплой в Railway...');
  
  try {
    // Выполнение команды деплоя
    const output = execSync('npm run deploy:railway', { encoding: 'utf8' });
    log(output);
    
    log('Деплой в Railway успешно выполнен', 'SUCCESS');
    return true;
  } catch (error) {
    log(`Ошибка при деплое в Railway: ${error.message}`, 'ERROR');
    return false;
  }
}

// Главная функция
async function main() {
  log('Запуск деплоя worker и scheduler в Railway...');
  
  // Проверка переменных окружения
  if (!checkEnvVariables()) {
    log('Проверка переменных окружения не пройдена', 'ERROR');
    process.exit(1);
  }
  
  // Проверка необходимых файлов
  if (!checkRequiredFiles()) {
    log('Проверка необходимых файлов не пройдена', 'ERROR');
    process.exit(1);
  }
  
  // Проверка настроек в railway.json
  if (!checkRailwayJson()) {
    log('Проверка настроек в railway.json не пройдена', 'ERROR');
    process.exit(1);
  }
  
  // Проверка скриптов в package.json
  if (!checkPackageJson()) {
    log('Проверка скриптов в package.json не пройдена', 'ERROR');
    process.exit(1);
  }
  
  // Деплой в Railway
  if (!deployToRailway()) {
    log('Деплой в Railway не выполнен', 'ERROR');
    process.exit(1);
  }
  
  log('Деплой worker и scheduler в Railway успешно выполнен', 'SUCCESS');
  log('Для проверки работы worker и scheduler запустите: npm run check:worker-scheduler', 'INFO');
}

// Запуск скрипта
main().catch(error => {
  log(`Критическая ошибка: ${error.message}`, 'ERROR');
  process.exit(1);
});
