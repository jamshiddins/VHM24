/**
 * Скрипт для тестирования всей системы VendHub
 * Проверяет наличие всех необходимых компонентов и их работоспособность
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { execSync } = require('child_process');

// Конфигурация
const API_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL || `${API_URL}/api/telegram/webhook`;

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
  }
  
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

// Функция для проверки наличия файла
function checkFileExists(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    return fs.existsSync(fullPath);
  } catch (error) {
    return false;
  }
}

// Функция для проверки наличия директории
function checkDirectoryExists(dirPath) {
  try {
    const fullPath = path.join(__dirname, dirPath);
    return fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
  } catch (error) {
    return false;
  }
}

// Функция для проверки API
async function checkAPI() {
  try {
    log('Проверка API...', 'info');
    
    const response = await axios.get(`${API_URL}/api/health`, { timeout: 5000 });
    
    if (response.status === 200) {
      log(`API работает: ${JSON.stringify(response.data)}`, 'success');
      return true;
    } else {
      log(`API вернул статус ${response.status}`, 'warning');
      return false;
    }
  } catch (error) {
    log(`Ошибка подключения к API: ${error.message}`, 'error');
    return false;
  }
}

// Функция для проверки вебхука Telegram
async function checkTelegramWebhook() {
  try {
    log('Проверка вебхука Telegram...', 'info');
    
    if (!BOT_TOKEN) {
      log('TELEGRAM_BOT_TOKEN не найден в переменных окружения', 'error');
      return false;
    }
    
    const response = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`, { timeout: 5000 });
    
    if (response.data && response.data.ok) {
      const webhookInfo = response.data.result;
      log(`Текущий вебхук: ${webhookInfo.url}`, 'info');
      
      if (webhookInfo.url === WEBHOOK_URL) {
        log('Вебхук настроен правильно', 'success');
        return true;
      } else {
        log(`Вебхук настроен неправильно. Ожидается: ${WEBHOOK_URL}, Текущий: ${webhookInfo.url}`, 'warning');
        return false;
      }
    } else {
      log(`Ошибка получения информации о вебхуке: ${JSON.stringify(response.data)}`, 'error');
      return false;
    }
  } catch (error) {
    log(`Ошибка проверки вебхука: ${error.message}`, 'error');
    return false;
  }
}

// Функция для проверки наличия всех FSM-сценариев
function checkFSMScenarios() {
  log('Проверка наличия всех FSM-сценариев...', 'info');
  
  const scenariosDir = 'apps/telegram-bot/src/scenes';
  const requiredScenarios = [
    'main-menu.scene.js',
    'task-create.scene.js',
    'task-execution.scene.js',
    'checklist.scene.js',
    'bag.scene.js',
    'warehouse-receive.scene.js',
    'warehouse-return.scene.js',
    'warehouse-inventory.scene.js',
    'cash.scene.js',
    'retro.scene.js',
    'error.scene.js',
    'import.scene.js',
    'directory.scene.js',
    'user.scene.js',
    'report.scene.js',
    'finance.scene.js',
    'admin.scene.js'
  ];
  
  const missingScenarios = [];
  
  for (const scenario of requiredScenarios) {
    const scenarioPath = path.join(scenariosDir, scenario);
    if (!checkFileExists(scenarioPath)) {
      missingScenarios.push(scenario);
    }
  }
  
  if (missingScenarios.length === 0) {
    log('Все FSM-сценарии найдены', 'success');
    return true;
  } else {
    log(`Отсутствуют следующие FSM-сценарии: ${missingScenarios.join(', ')}`, 'error');
    return false;
  }
}

// Функция для проверки наличия всех утилитарных файлов
function checkUtilityFiles() {
  log('Проверка наличия всех утилитарных файлов...', 'info');
  
  const utilsDir = 'apps/telegram-bot/src/utils';
  const requiredUtils = [
    'fsm-helpers.js',
    'fsm-integrator.js',
    'logger.js',
    's3.js',
    'prisma-mock.js',
    'excelImport.js'
  ];
  
  const missingUtils = [];
  
  for (const util of requiredUtils) {
    const utilPath = path.join(utilsDir, util);
    if (!checkFileExists(utilPath)) {
      missingUtils.push(util);
    }
  }
  
  if (missingUtils.length === 0) {
    log('Все утилитарные файлы найдены', 'success');
    return true;
  } else {
    log(`Отсутствуют следующие утилитарные файлы: ${missingUtils.join(', ')}`, 'error');
    return false;
  }
}

// Функция для проверки наличия всех скриптов запуска
function checkStartupScripts() {
  log('Проверка наличия всех скриптов запуска...', 'info');
  
  const requiredScripts = [
    'start-telegram-bot.js',
    'start-vendhub-complete.js',
    'start-vendhub-railway.js'
  ];
  
  const missingScripts = [];
  
  for (const script of requiredScripts) {
    if (!checkFileExists(script)) {
      missingScripts.push(script);
    }
  }
  
  if (missingScripts.length === 0) {
    log('Все скрипты запуска найдены', 'success');
    return true;
  } else {
    log(`Отсутствуют следующие скрипты запуска: ${missingScripts.join(', ')}`, 'error');
    return false;
  }
}

// Функция для проверки наличия всех API-маршрутов
function checkAPIRoutes() {
  log('Проверка наличия всех API-маршрутов...', 'info');
  
  const routesDir = 'backend/src/routes';
  const requiredRoutes = [
    'auth.js',
    'health.js',
    'machines.js',
    'tasks.js',
    'users.js',
    'telegram.js',
    'inventory.js',
    'warehouse.js',
    'data-import.js'
  ];
  
  const missingRoutes = [];
  
  for (const route of requiredRoutes) {
    const routePath = path.join(routesDir, route);
    if (!checkFileExists(routePath)) {
      missingRoutes.push(route);
    }
  }
  
  if (missingRoutes.length === 0) {
    log('Все API-маршруты найдены', 'success');
    return true;
  } else {
    log(`Отсутствуют следующие API-маршруты: ${missingRoutes.join(', ')}`, 'error');
    return false;
  }
}

// Функция для проверки наличия всех переменных окружения
function checkEnvironmentVariables() {
  log('Проверка наличия всех переменных окружения...', 'info');
  
  const requiredVars = [
    'NODE_ENV',
    'PORT',
    'TELEGRAM_BOT_TOKEN',
    'API_BASE_URL'
  ];
  
  const missingVars = [];
  
  for (const variable of requiredVars) {
    if (!process.env[variable]) {
      missingVars.push(variable);
    }
  }
  
  if (missingVars.length === 0) {
    log('Все необходимые переменные окружения найдены', 'success');
    return true;
  } else {
    log(`Отсутствуют следующие переменные окружения: ${missingVars.join(', ')}`, 'warning');
    return false;
  }
}

// Функция для проверки наличия всех зависимостей
function checkDependencies() {
  log('Проверка наличия всех зависимостей...', 'info');
  
  try {
    const packageJson = require('./package.json');
    const requiredDeps = [
      'express',
      'telegraf',
      'axios',
      'cors',
      'dotenv',
      '@prisma/client'
    ];
    
    const missingDeps = [];
    
    for (const dep of requiredDeps) {
      if (!packageJson.dependencies[dep]) {
        missingDeps.push(dep);
      }
    }
    
    if (missingDeps.length === 0) {
      log('Все необходимые зависимости найдены', 'success');
      return true;
    } else {
      log(`Отсутствуют следующие зависимости: ${missingDeps.join(', ')}`, 'warning');
      return false;
    }
  } catch (error) {
    log(`Ошибка проверки зависимостей: ${error.message}`, 'error');
    return false;
  }
}

// Функция для проверки наличия всех директорий
function checkDirectories() {
  log('Проверка наличия всех директорий...', 'info');
  
  const requiredDirs = [
    'apps/telegram-bot',
    'apps/telegram-bot/src',
    'apps/telegram-bot/src/scenes',
    'apps/telegram-bot/src/utils',
    'backend',
    'backend/src',
    'backend/src/routes',
    'backend/src/middleware',
    'backend/src/utils',
    'backend/prisma',
    'logs'
  ];
  
  const missingDirs = [];
  
  for (const dir of requiredDirs) {
    if (!checkDirectoryExists(dir)) {
      missingDirs.push(dir);
    }
  }
  
  if (missingDirs.length === 0) {
    log('Все необходимые директории найдены', 'success');
    return true;
  } else {
    log(`Отсутствуют следующие директории: ${missingDirs.join(', ')}`, 'warning');
    return false;
  }
}

// Функция для проверки наличия всех документов
function checkDocumentation() {
  log('Проверка наличия всей документации...', 'info');
  
  const requiredDocs = [
    'VENDHUB_COMPLETE_SYSTEM_GUIDE.md',
    'apps/telegram-bot/FSM_DOCUMENTATION.md'
  ];
  
  const missingDocs = [];
  
  for (const doc of requiredDocs) {
    if (!checkFileExists(doc)) {
      missingDocs.push(doc);
    }
  }
  
  if (missingDocs.length === 0) {
    log('Вся документация найдена', 'success');
    return true;
  } else {
    log(`Отсутствуют следующие документы: ${missingDocs.join(', ')}`, 'warning');
    return false;
  }
}

// Главная функция тестирования
async function testSystem() {
  log('=== ТЕСТИРОВАНИЕ СИСТЕМЫ VENDHUB ===', 'title');
  log(`Дата и время: ${new Date().toLocaleString('ru-RU')}`, 'info');
  log(`Рабочая директория: ${__dirname}`, 'info');
  log(`NODE_ENV: ${process.env.NODE_ENV || 'не указан'}`, 'info');
  log(`API_URL: ${API_URL}`, 'info');
  log(`WEBHOOK_URL: ${WEBHOOK_URL}`, 'info');
  log('', 'info');
  
  // Проверка наличия директорий
  const directoriesOk = checkDirectories();
  log('', 'info');
  
  // Проверка наличия всех FSM-сценариев
  const fsmScenariosOk = checkFSMScenarios();
  log('', 'info');
  
  // Проверка наличия всех утилитарных файлов
  const utilityFilesOk = checkUtilityFiles();
  log('', 'info');
  
  // Проверка наличия всех API-маршрутов
  const apiRoutesOk = checkAPIRoutes();
  log('', 'info');
  
  // Проверка наличия всех скриптов запуска
  const startupScriptsOk = checkStartupScripts();
  log('', 'info');
  
  // Проверка наличия всех переменных окружения
  const environmentVariablesOk = checkEnvironmentVariables();
  log('', 'info');
  
  // Проверка наличия всех зависимостей
  const dependenciesOk = checkDependencies();
  log('', 'info');
  
  // Проверка наличия всей документации
  const documentationOk = checkDocumentation();
  log('', 'info');
  
  // Проверка API (опционально)
  let apiOk = false;
  try {
    apiOk = await checkAPI();
  } catch (error) {
    log(`Ошибка проверки API: ${error.message}`, 'error');
  }
  log('', 'info');
  
  // Проверка вебхука Telegram (опционально)
  let webhookOk = false;
  if (BOT_TOKEN) {
    try {
      webhookOk = await checkTelegramWebhook();
    } catch (error) {
      log(`Ошибка проверки вебхука: ${error.message}`, 'error');
    }
  } else {
    log('Пропуск проверки вебхука: TELEGRAM_BOT_TOKEN не указан', 'warning');
  }
  log('', 'info');
  
  // Вывод результатов
  log('=== РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ ===', 'title');
  log(`Директории: ${directoriesOk ? '✅ OK' : '❌ ОШИБКА'}`, directoriesOk ? 'success' : 'error');
  log(`FSM-сценарии: ${fsmScenariosOk ? '✅ OK' : '❌ ОШИБКА'}`, fsmScenariosOk ? 'success' : 'error');
  log(`Утилитарные файлы: ${utilityFilesOk ? '✅ OK' : '❌ ОШИБКА'}`, utilityFilesOk ? 'success' : 'error');
  log(`API-маршруты: ${apiRoutesOk ? '✅ OK' : '❌ ОШИБКА'}`, apiRoutesOk ? 'success' : 'error');
  log(`Скрипты запуска: ${startupScriptsOk ? '✅ OK' : '❌ ОШИБКА'}`, startupScriptsOk ? 'success' : 'error');
  log(`Переменные окружения: ${environmentVariablesOk ? '✅ OK' : '⚠️ ПРЕДУПРЕЖДЕНИЕ'}`, environmentVariablesOk ? 'success' : 'warning');
  log(`Зависимости: ${dependenciesOk ? '✅ OK' : '⚠️ ПРЕДУПРЕЖДЕНИЕ'}`, dependenciesOk ? 'success' : 'warning');
  log(`Документация: ${documentationOk ? '✅ OK' : '⚠️ ПРЕДУПРЕЖДЕНИЕ'}`, documentationOk ? 'success' : 'warning');
  log(`API: ${apiOk ? '✅ OK' : '⚠️ НЕ ЗАПУЩЕН'}`, apiOk ? 'success' : 'warning');
  log(`Вебхук Telegram: ${webhookOk ? '✅ OK' : '⚠️ НЕ НАСТРОЕН'}`, webhookOk ? 'success' : 'warning');
  log('', 'info');
  
  // Общий результат
  const criticalChecks = [directoriesOk, fsmScenariosOk, utilityFilesOk, apiRoutesOk, startupScriptsOk];
  const allCriticalOk = criticalChecks.every(check => check);
  
  if (allCriticalOk) {
    log('✅ СИСТЕМА ГОТОВА К ЗАПУСКУ', 'success');
    
    if (apiOk && webhookOk) {
      log('✅ СИСТЕМА ПОЛНОСТЬЮ РАБОТОСПОСОБНА', 'success');
    } else {
      log('⚠️ СИСТЕМА ГОТОВА К ЗАПУСКУ, НО ТРЕБУЕТСЯ ЗАПУСТИТЬ API И/ИЛИ НАСТРОИТЬ ВЕБХУК', 'warning');
    }
  } else {
    log('❌ СИСТЕМА НЕ ГОТОВА К ЗАПУСКУ', 'error');
    log('Исправьте ошибки и запустите тест снова', 'error');
  }
}

// Запуск тестирования
testSystem().catch(error => {
  log(`Ошибка тестирования: ${error.message}`, 'error');
  process.exit(1);
});
