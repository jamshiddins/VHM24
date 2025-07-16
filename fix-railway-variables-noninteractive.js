#!/usr/bin/env node
/**
 * Скрипт для исправления переменных окружения в Railway без интерактивного ввода
 * Запускается командой: node fix-railway-variables-noninteractive.js
 */

require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Цвета для вывода в консоль
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Функция для логирования
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  let color = colors.white;
  
  switch (type) {
    case 'success':
      color = colors.green;
      break;
    case 'error':
      color = colors.red;
      break;
    case 'warning':
      color = colors.yellow;
      break;
    case 'info':
      color = colors.blue;
      break;
    case 'title':
      color = colors.magenta;
      break;
    default:
      color = colors.white;
  }
  
  console.log(`${color}[${timestamp}] [${type.toUpperCase()}] ${message}${colors.reset}`);
}

// Функция для выполнения команды и возврата результата
function executeCommand(command, options = {}) {
  try {
    log(`Выполнение команды: ${command}`, 'info');
    const result = execSync(command, { encoding: 'utf8', ...options });
    return result.trim();
  } catch (error) {
    log(`Ошибка выполнения команды: ${error.message}`, 'error');
    if (error.stdout) log(`Вывод stdout: ${error.stdout}`, 'error');
    if (error.stderr) log(`Вывод stderr: ${error.stderr}`, 'error');
    return null;
  }
}

// Функция для проверки наличия Railway CLI
function checkRailwayCLI() {
  try {
    // Проверка наличия Railway CLI
    try {
      const help = executeCommand('railway --help');
      log(`✅ Railway CLI установлен`, 'success');
      return true;
    } catch (error) {
      throw error;
    }
  } catch (error) {
    log('❌ Railway CLI не установлен', 'error');
    log('Установка Railway CLI...', 'info');
    
    try {
      // Установка Railway CLI
      executeCommand('npm install -g @railway/cli');
      
      // Проверка установки
      try {
        const help = executeCommand('railway --help');
        log(`✅ Railway CLI успешно установлен`, 'success');
        return true;
      } catch (error) {
        throw error;
      }
    } catch (installError) {
      log(`❌ Не удалось установить Railway CLI: ${installError.message}`, 'error');
      log('Пожалуйста, установите Railway CLI вручную: npm install -g @railway/cli', 'warning');
      return false;
    }
  }
}

// Функция для входа в Railway
async function loginToRailway() {
  try {
    // Проверка, авторизован ли пользователь
    try {
      const whoami = executeCommand('railway whoami');
      log(`✅ Вы уже авторизованы в Railway как: ${whoami}`, 'success');
      return true;
    } catch (error) {
      // Пользователь не авторизован, выполняем вход
      log('Вы не авторизованы в Railway, выполняем вход...', 'warning');
      
      log('Для входа в Railway откроется браузер. Пожалуйста, авторизуйтесь в браузере.', 'info');
      try {
        executeCommand('railway login');
      } catch (error) {
        throw error;
      }
      
      // Проверка успешности входа
      try {
        const whoami = executeCommand('railway whoami');
        log(`✅ Вы успешно авторизовались в Railway как: ${whoami}`, 'success');
        return true;
      } catch (error) {
        log(`❌ Не удалось авторизоваться в Railway: ${error.message}`, 'error');
        return false;
      }
    }
  } catch (error) {
    log(`❌ Ошибка при входе в Railway: ${error.message}`, 'error');
    return false;
  }
}

// Функция для выбора проекта в Railway
async function selectProject() {
  try {
    // Получение ID проекта из переменной окружения
    const projectId = process.env.RAILWAY_PROJECT_ID;
    
    if (!projectId) {
      log('❌ Переменная окружения RAILWAY_PROJECT_ID не найдена', 'error');
      return null;
    }
    
    log(`Используем ID проекта из переменной окружения: ${projectId}`, 'info');
    
    // Выбор проекта по ID
    try {
      executeCommand(`railway link ${projectId}`);
      log(`✅ Выбран проект Railway с ID: ${projectId}`, 'success');
      return projectId;
    } catch (error) {
      log(`❌ Не удалось выбрать проект с ID ${projectId}: ${error.message}`, 'error');
      
      // Попробуем получить список проектов
      try {
        const projects = executeCommand('railway list');
        log(`Доступные проекты: ${projects}`, 'info');
        
        // Попробуем выбрать проект по имени VHM24
        try {
          executeCommand('railway link VHM24');
          log('✅ Выбран проект Railway: VHM24', 'success');
          return 'VHM24';
        } catch (nameError) {
          log(`❌ Не удалось выбрать проект по имени: ${nameError.message}`, 'error');
          return null;
        }
      } catch (listError) {
        log(`❌ Не удалось получить список проектов: ${listError.message}`, 'error');
        return null;
      }
    }
  } catch (error) {
    log(`❌ Ошибка при выборе проекта: ${error.message}`, 'error');
    return null;
  }
}

// Функция для установки переменных окружения в Railway
async function setEnvironmentVariables() {
  try {
    // Чтение переменных окружения из .env
    const envPath = path.join(__dirname, '.env');
    
    if (!fs.existsSync(envPath)) {
      log('❌ Файл .env не найден', 'error');
      return false;
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    // Парсинг переменных окружения из .env
    const envVariables = {};
    
    for (const line of envLines) {
      if (line.trim() && !line.startsWith('#')) {
        const match = line.match(/^([^=]+)=(.*)$/);
        
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim();
          
          if (key && value) {
            envVariables[key] = value;
          }
        }
      }
    }
    
    log(`✅ Получено ${Object.keys(envVariables).length} переменных окружения из .env`, 'success');
    
    // Список необходимых переменных окружения
    const requiredVariables = [
      'DATABASE_URL',
      'REDIS_URL',
      'TELEGRAM_BOT_TOKEN',
      'PORT',
      'RAILWAY_PUBLIC_URL',
      'NODE_ENV',
      'JWT_SECRET',
      'ADMIN_IDS',
      'WEBHOOK_URL',
      'CORS_ORIGIN',
      'S3_ACCESS_KEY',
      'S3_SECRET_KEY',
      'S3_REGION',
      'S3_BUCKET_NAME',
      'S3_BACKUP_BUCKET',
      'S3_ENDPOINT',
      'S3_UPLOAD_URL',
      'S3_BACKUP_URL',
      'METRICS_ENABLED'
    ];
    
    // Установка переменных окружения в Railway
    for (const variable of requiredVariables) {
      if (envVariables[variable]) {
        try {
          // Используем правильный синтаксис для установки переменных окружения
          executeCommand(`railway variables --set "${variable}=${envVariables[variable]}"`);
          log(`✅ Установлена переменная окружения ${variable} в Railway`, 'success');
        } catch (error) {
          log(`❌ Ошибка при установке переменной окружения ${variable} в Railway: ${error.message}`, 'error');
        }
      } else {
        log(`⚠️ Переменная окружения ${variable} отсутствует в .env`, 'warning');
      }
    }
    
    return true;
  } catch (error) {
    log(`❌ Ошибка при установке переменных окружения: ${error.message}`, 'error');
    return false;
  }
}

// Главная функция
async function main() {
  log('=== ИСПРАВЛЕНИЕ ПЕРЕМЕННЫХ ОКРУЖЕНИЯ В RAILWAY ===', 'title');
  
  try {
    // Проверка наличия Railway CLI
    const railwayCLIInstalled = checkRailwayCLI();
    
    if (!railwayCLIInstalled) {
      log('❌ Не удалось установить Railway CLI', 'error');
      return;
    }
    
    // Вход в Railway
    const loggedIn = await loginToRailway();
    
    if (!loggedIn) {
      log('❌ Не удалось войти в Railway', 'error');
      return;
    }
    
    // Выбор проекта
    const projectName = await selectProject();
    
    if (!projectName) {
      log('❌ Не удалось выбрать проект', 'error');
      return;
    }
    
    // Установка переменных окружения
    const environmentVariablesSet = await setEnvironmentVariables();
    
    if (!environmentVariablesSet) {
      log('❌ Не удалось установить переменные окружения', 'error');
      return;
    }
    
    // Вывод итогового результата
    log('=== ИТОГОВЫЙ РЕЗУЛЬТАТ ===', 'title');
    log('✅ Переменные окружения успешно установлены в Railway', 'success');
    
    log('', 'info');
    log('Для перезапуска сервисов выполните команду:', 'info');
    log('railway up', 'info');
  } catch (error) {
    log(`❌ Критическая ошибка: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Запуск скрипта
main().catch(error => {
  log(`❌ Критическая ошибка: ${error.message}`, 'error');
  process.exit(1);
});
