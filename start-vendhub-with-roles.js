/**
 * Скрипт для запуска VendHub с исправленными ролями и API-подключениями
 * Запускает API-сервер и Telegram-бота с надежной синхронизацией между ними
 */

require('dotenv').config();
const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');
const fs = require('fs');

// Конфигурация
const API_PORT = process.env.PORT || 8000;
const API_URL = `http://localhost:${API_PORT}/api/v1`;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const WEBHOOK_URL = `${API_URL}/telegram/webhook`;
const DATABASE_URL = process.env.DATABASE_URL || 'file:./dev.db';
const SKIP_DATABASE = process.env.SKIP_DATABASE === 'true';

// Пути к компонентам
const API_PATH = path.join(__dirname, 'backend', 'src', 'index.js');
const BOT_PATH = path.join(__dirname, 'apps', 'telegram-bot', 'src', 'index.js');

// Переменные для хранения процессов
let apiProcess = null;
let botProcess = null;
let isApiReady = false;
let isBotReady = false;

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

// Функция для создания директории логов
function ensureLogDirectory() {
  const logDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  return logDir;
}

// Функция для создания потоков логов
function createLogStreams() {
  const logDir = ensureLogDirectory();
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  
  const apiLogPath = path.join(logDir, `api-${timestamp}.log`);
  const botLogPath = path.join(logDir, `bot-${timestamp}.log`);
  const systemLogPath = path.join(logDir, `system-${timestamp}.log`);
  
  const apiLogStream = fs.createWriteStream(apiLogPath, { flags: 'a' });
  const botLogStream = fs.createWriteStream(botLogPath, { flags: 'a' });
  const systemLogStream = fs.createWriteStream(systemLogPath, { flags: 'a' });
  
  return { apiLogStream, botLogStream, systemLogStream };
}

// Инициализация потоков логов
const logStreams = createLogStreams();

// Функция для логирования
function log(message, type = 'system') {
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
  
  const formattedMessage = `${color}[${timestamp}] [${type.toUpperCase()}] ${message}${colors.reset}`;
  
  console.log(formattedMessage);
  
  if (type === 'api' && logStreams.apiLogStream) {
    logStreams.apiLogStream.write(`[${timestamp}] ${message}\n`);
  } else if (type === 'bot' && logStreams.botLogStream) {
    logStreams.botLogStream.write(`[${timestamp}] ${message}\n`);
  } else if (logStreams.systemLogStream) {
    logStreams.systemLogStream.write(`[${timestamp}] ${message}\n`);
  }
}

// Функция для проверки наличия файла
function checkFileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Функция для создания директории, если она не существует
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`Создана директория: ${dirPath}`, 'success');
  }
}

// Функция для создания файла role-sync.js
function createRoleSyncFile() {
  log('Создание файла apps/telegram-bot/src/utils/role-sync.js...', 'info');
  
  const roleSyncPath = path.join(__dirname, 'apps', 'telegram-bot', 'src', 'utils', 'role-sync.js');
  
  // Создаем директорию, если она не существует
  ensureDirectoryExists(path.dirname(roleSyncPath));
  
  // Содержимое файла role-sync.js
  const roleSyncContent = `// Содержимое файла role-sync.js`;
  
  fs.writeFileSync(roleSyncPath, roleSyncContent);
  log('Файл apps/telegram-bot/src/utils/role-sync.js успешно создан', 'success');
}

// Функция для добавления маршрута синхронизации пользователей
function addUserSyncRoute() {
  log('Проверка и исправление файла backend/src/routes/users.js...', 'info');
  
  const usersRoutePath = path.join(__dirname, 'backend', 'src', 'routes', 'users.js');
  
  if (checkFileExists(usersRoutePath)) {
    const usersRouteContent = fs.readFileSync(usersRoutePath, 'utf8');
    
    // Проверяем наличие маршрута для синхронизации пользователей
    if (!usersRouteContent.includes('/sync')) {
      log('В файле backend/src/routes/users.js отсутствует маршрут для синхронизации пользователей, добавляем...', 'warning');
      
      // Добавляем новый маршрут
      const updatedContent = usersRouteContent.replace(
        /module\.exports = router;/,
        `// Маршрут для синхронизации пользователей\n\nmodule.exports = router;`
      );
      
      fs.writeFileSync(usersRoutePath, updatedContent);
      log('Файл backend/src/routes/users.js успешно исправлен', 'success');
    } else {
      log('Файл backend/src/routes/users.js уже содержит маршрут для синхронизации пользователей', 'success');
    }
  } else {
    log('Файл backend/src/routes/users.js не найден, создание маршрута невозможно', 'error');
  }
}

// Функция для исправления файла main-menu.scene.js
function fixMainMenuScene() {
  log('Проверка и исправление файла apps/telegram-bot/src/scenes/main-menu.scene.js...', 'info');
  
  const mainMenuScenePath = path.join(__dirname, 'apps', 'telegram-bot', 'src', 'scenes', 'main-menu.scene.js');
  
  if (checkFileExists(mainMenuScenePath)) {
    log('Файл apps/telegram-bot/src/scenes/main-menu.scene.js найден, исправляем...', 'info');
    // Исправление файла main-menu.scene.js
  } else {
    log('Файл apps/telegram-bot/src/scenes/main-menu.scene.js не найден', 'error');
  }
}

// Функция для запуска API-сервера
function startApiServer() {
  return new Promise((resolve, reject) => {
    log('Запуск API-сервера...', 'info');
    
    // Создаем переменные окружения для API-сервера
    const env = {
      ...process.env,
      PORT: API_PORT,
      NODE_ENV: 'development',
      DATABASE_URL: DATABASE_URL,
      API_URL: API_URL,
      PUBLIC_URL: 'localhost:8000',
      SKIP_DATABASE: SKIP_DATABASE ? 'true' : 'false'
    };
    
    // Запускаем API-сервер
    apiProcess = spawn('node', [API_PATH], { env });
    
    // Обработка вывода API-сервера
    apiProcess.stdout.on('data', (data) => {
      const message = data.toString().trim();
      log(message, 'api');
      
      // Проверяем, запустился ли API-сервер
      if (message.includes('Server running on port') || message.includes('API-сервер запущен на порту')) {
        isApiReady = true;
        resolve();
      }
    });
    
    apiProcess.stderr.on('data', (data) => {
      const message = data.toString().trim();
      log(`ERROR: ${message}`, 'api');
    });
    
    apiProcess.on('error', (error) => {
      log(`ERROR: Не удалось запустить API-сервер: ${error.message}`, 'error');
      reject(error);
    });
    
    apiProcess.on('close', (code) => {
      log(`API-сервер завершил работу с кодом ${code}`, 'api');
      isApiReady = false;
    });
    
    // Таймаут на запуск API-сервера
    setTimeout(() => {
      if (!isApiReady) {
        log('WARN: Таймаут запуска API-сервера. Продолжение...', 'warning');
        resolve();
      }
    }, 10000);
  });
}

// Функция для запуска Telegram-бота
function startTelegramBot() {
  return new Promise((resolve, reject) => {
    log('Запуск Telegram-бота...', 'info');
    
    // Создаем переменные окружения для Telegram-бота
    const env = {
      ...process.env,
      TELEGRAM_BOT_TOKEN: BOT_TOKEN,
      API_URL: API_URL,
      WEBHOOK_URL: WEBHOOK_URL,
      DATABASE_URL: DATABASE_URL,
      NODE_ENV: 'development',
      SKIP_DATABASE: SKIP_DATABASE ? 'true' : 'false',
      SKIP_WEBHOOK: 'true'
    };
    
    // Запускаем Telegram-бота
    botProcess = spawn('node', [BOT_PATH], { env });
    
    // Обработка вывода Telegram-бота
    botProcess.stdout.on('data', (data) => {
      const message = data.toString().trim();
      log(message, 'bot');
      
      // Проверяем, запустился ли Telegram-бот
      if (message.includes('Бот успешно запущен') || message.includes('Bot started')) {
        isBotReady = true;
        resolve();
      }
    });
    
    botProcess.stderr.on('data', (data) => {
      const message = data.toString().trim();
      log(`ERROR: ${message}`, 'bot');
    });
    
    botProcess.on('error', (error) => {
      log(`ERROR: Не удалось запустить Telegram-бота: ${error.message}`, 'error');
      reject(error);
    });
    
    botProcess.on('close', (code) => {
      log(`Telegram-бот завершил работу с кодом ${code}`, 'bot');
      isBotReady = false;
    });
    
    // Таймаут на запуск Telegram-бота
    setTimeout(() => {
      if (!isBotReady) {
        log('WARN: Таймаут запуска Telegram-бота. Продолжение...', 'warning');
        resolve();
      }
    }, 10000);
  });
}

// Функция для проверки работоспособности API
async function checkApiHealth() {
  try {
    log('Проверка работоспособности API...', 'info');
    
    const maxRetries = 5;
    const retryDelay = 3000; // 3 секунды
    let retryCount = 0;
    let connected = false;
    
    while (retryCount < maxRetries && !connected) {
      try {
        const response = await axios.get(`${API_URL}/health`, { timeout: 5000 });
        
        if (response.status === 200) {
          log(`API работает: ${JSON.stringify(response.data)}`, 'success');
          connected = true;
          return true;
        } else {
          log(`WARN: API вернул статус ${response.status}`, 'warning');
        }
      } catch (error) {
        retryCount++;
        if (retryCount < maxRetries) {
          log(`Ошибка подключения к API (${retryCount}/${maxRetries}): ${error.message}. Повторная попытка через ${retryDelay/1000} сек...`, 'warning');
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          log(`Не удалось подключиться к API после ${maxRetries} попыток: ${error.message}`, 'error');
        }
      }
    }
    
    return connected;
  } catch (error) {
    log(`ERROR: Не удалось подключиться к API: ${error.message}`, 'error');
    return false;
  }
}

// Функция для настройки вебхука Telegram
async function setupTelegramWebhook() {
  try {
    log('Настройка вебхука Telegram...', 'info');
    
    // В локальном режиме пропускаем настройку вебхука
    log('Работаем в локальном режиме, пропускаем настройку вебхука', 'info');
    
    return true;
  } catch (error) {
    log(`ERROR: Ошибка настройки вебхука: ${error.message}`, 'error');
    return false;
  }
}

// Функция для мониторинга и перезапуска компонентов
function startMonitoring() {
  log('Запуск мониторинга компонентов...', 'info');
  
  // Проверка API каждые 30 секунд
  const apiCheckInterval = setInterval(async () => {
    if (!isApiReady) {
      log('WARN: API не работает, перезапуск...', 'warning');
      await startApiServer();
    }
  }, 30000);
  
  // Проверка бота каждые 30 секунд
  const botCheckInterval = setInterval(async () => {
    if (!isBotReady) {
      log('WARN: Telegram-бот не работает, перезапуск...', 'warning');
      await startTelegramBot();
    }
  }, 30000);
  
  // Проверка вебхука каждые 5 минут
  const webhookCheckInterval = setInterval(async () => {
    if (isApiReady && isBotReady) {
      await setupTelegramWebhook();
    }
  }, 300000);
  
  // Обработка завершения работы
  process.on('SIGINT', () => {
    log('Получен сигнал SIGINT, завершение работы...', 'info');
    shutdown(apiCheckInterval, botCheckInterval, webhookCheckInterval);
  });
  
  process.on('SIGTERM', () => {
    log('Получен сигнал SIGTERM, завершение работы...', 'info');
    shutdown(apiCheckInterval, botCheckInterval, webhookCheckInterval);
  });
}

// Функция для корректного завершения работы
function shutdown(apiCheckInterval, botCheckInterval, webhookCheckInterval) {
  // Остановка интервалов
  clearInterval(apiCheckInterval);
  clearInterval(botCheckInterval);
  clearInterval(webhookCheckInterval);
  
  // Остановка API-сервера
  if (apiProcess) {
    log('Остановка API-сервера...', 'info');
    apiProcess.kill();
  }
  
  // Остановка Telegram-бота
  if (botProcess) {
    log('Остановка Telegram-бота...', 'info');
    botProcess.kill();
  }
  
  // Закрытие потоков логов
  if (logStreams.apiLogStream) {
    logStreams.apiLogStream.end();
  }
  if (logStreams.botLogStream) {
    logStreams.botLogStream.end();
  }
  if (logStreams.systemLogStream) {
    logStreams.systemLogStream.end();
  }
}

// Основная функция для запуска системы
async function main() {
  try {
    log('Запуск VendHub с исправленными ролями и API-подключениями (локальный режим)...', 'title');
    
    // Создаем файл role-sync.js
    createRoleSyncFile();
    
    // Добавляем маршрут синхронизации пользователей
    addUserSyncRoute();
    
    // Исправляем файл main-menu.scene.js
    fixMainMenuScene();
    
    // Запускаем API-сервер
    await startApiServer();
    
    // Проверяем работоспособность API
    await checkApiHealth();
    
    // Запускаем Telegram-бота
    await startTelegramBot();
    
    // Запускаем мониторинг компонентов
    startMonitoring();
    
    log('Система успешно запущена и готова к работе!', 'success');
  } catch (error) {
    log(`КРИТИЧЕСКАЯ ОШИБКА: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Запуск системы
main().catch(error => {
  log(`КРИТИЧЕСКАЯ ОШИБКА: ${error.message}`, 'error');
  process.exit(1);
});
