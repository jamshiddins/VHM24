/**
 * Скрипт для запуска VendHub системы с исправленными ошибками подключения к API
 * Запускает API-сервер и Telegram-бота с надежной синхронизацией между ними
 */

require('dotenv').config();
const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');
const fs = require('fs');

// Конфигурация
const API_PORT = process.env.PORT || 3000;
const API_URL = process.env.API_BASE_URL || `http://localhost:${API_PORT}`;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const WEBHOOK_URL = process.env.WEBHOOK_URL || `${API_URL}/api/telegram/webhook`;

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

// Функция для запуска API-сервера
function startApiServer() {
  return new Promise((resolve, reject) => {
    log('Запуск API-сервера...', 'info');
    
    // Создаем переменные окружения для API-сервера
    const env = {
      ...process.env,
      PORT: API_PORT,
      NODE_ENV: process.env.NODE_ENV || 'development',
      SKIP_DATABASE: process.env.SKIP_DATABASE || 'true',
      DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db'
    };
    
    // Запускаем API-сервер
    apiProcess = spawn('node', [API_PATH], { env });
    
    // Обработка вывода API-сервера
    apiProcess.stdout.on('data', (data) => {
      const message = data.toString().trim();
      log(message, 'api');
      
      // Проверяем, запустился ли API-сервер
      if (message.includes('Server running on port') || message.includes('API server started')) {
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
      API_BASE_URL: API_URL,
      WEBHOOK_URL: WEBHOOK_URL,
      SKIP_DATABASE: process.env.SKIP_DATABASE || 'true',
      NODE_ENV: process.env.NODE_ENV || 'development'
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
        const response = await axios.get(`${API_URL}/api/health`, { timeout: 5000 });
        
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
    
    const maxRetries = 3;
    const retryDelay = 2000; // 2 секунды
    let retryCount = 0;
    let success = false;
    
    while (retryCount < maxRetries && !success) {
      try {
        const response = await axios.post(`${API_URL}/api/telegram/setWebhook?token=${BOT_TOKEN}`, {
          url: WEBHOOK_URL
        }, { timeout: 5000 });
        
        if (response.data && response.data.success) {
          log(`Вебхук успешно настроен: ${WEBHOOK_URL}`, 'success');
          success = true;
          return true;
        } else {
          log(`WARN: Не удалось настроить вебхук: ${JSON.stringify(response.data)}`, 'warning');
        }
      } catch (error) {
        retryCount++;
        if (retryCount < maxRetries) {
          log(`Ошибка настройки вебхука (${retryCount}/${maxRetries}): ${error.message}. Повторная попытка через ${retryDelay/1000} сек...`, 'warning');
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          log(`Не удалось настроить вебхук после ${maxRetries} попыток: ${error.message}`, 'error');
        }
      }
    }
    
    return success;
  } catch (error) {
    log(`ERROR: Ошибка настройки вебхука: ${error.message}`, 'error');
    return false;
  }
}

// Функция для проверки статуса вебхука
async function checkWebhookStatus() {
  try {
    log('Проверка статуса вебхука...', 'info');
    
    const maxRetries = 3;
    const retryDelay = 2000; // 2 секунды
    let retryCount = 0;
    let success = false;
    
    while (retryCount < maxRetries && !success) {
      try {
        const response = await axios.get(`${API_URL}/api/telegram/status?token=${BOT_TOKEN}`, { timeout: 5000 });
        
        if (response.data && response.data.success) {
          log(`Статус вебхука: ${JSON.stringify(response.data.telegramResponse)}`, 'success');
          success = true;
          return true;
        } else {
          log(`WARN: Не удалось получить статус вебхука: ${JSON.stringify(response.data)}`, 'warning');
        }
      } catch (error) {
        retryCount++;
        if (retryCount < maxRetries) {
          log(`Ошибка проверки статуса вебхука (${retryCount}/${maxRetries}): ${error.message}. Повторная попытка через ${retryDelay/1000} сек...`, 'warning');
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          log(`Не удалось проверить статус вебхука после ${maxRetries} попыток: ${error.message}`, 'error');
        }
      }
    }
    
    return success;
  } catch (error) {
    log(`ERROR: Ошибка проверки статуса вебхука: ${error.message}`, 'error');
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
    } else {
      const isHealthy = await checkApiHealth();
      if (!isHealthy) {
        log('WARN: API не отвечает, перезапуск...', 'warning');
        if (apiProcess) {
          apiProcess.kill();
        }
        await startApiServer();
      }
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
      const isWebhookOk = await checkWebhookStatus();
      if (!isWebhookOk) {
        log('WARN: Вебхук не работает, переустановка...', 'warning');
        await setupTelegramWebhook();
      }
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
  
  log('Система VendHub успешно остановлена', 'success');
  process.exit(0);
}

// Создание потоков логов
const logStreams = createLogStreams();

// Главная функция запуска системы
async function startSystem() {
  try {
    log('=== ЗАПУСК СИСТЕМЫ VENDHUB ===', 'title');
    log(`Дата и время: ${new Date().toLocaleString('ru-RU')}`, 'info');
    log(`Рабочая директория: ${__dirname}`, 'info');
    log(`NODE_ENV: ${process.env.NODE_ENV || 'не указан'}`, 'info');
    log(`API_URL: ${API_URL}`, 'info');
    log(`WEBHOOK_URL: ${WEBHOOK_URL}`, 'info');
    log('', 'info');
    
    // Проверка наличия директории logs
    ensureLogDirectory();
    
    // Запуск API-сервера
    log('Шаг 1: Запуск API-сервера', 'title');
    await startApiServer();
    
    // Проверка работоспособности API
    log('Шаг 2: Проверка работоспособности API', 'title');
    const isApiHealthy = await checkApiHealth();
    if (!isApiHealthy) {
      log('WARN: API не отвечает, но продолжаем запуск...', 'warning');
    }
    
    // Запуск Telegram-бота
    log('Шаг 3: Запуск Telegram-бота', 'title');
    await startTelegramBot();
    
    // Настройка вебхука
    log('Шаг 4: Настройка вебхука', 'title');
    if (isApiReady) {
      await setupTelegramWebhook();
      await checkWebhookStatus();
    }
    
    // Запуск мониторинга
    log('Шаг 5: Запуск мониторинга', 'title');
    startMonitoring();
    
    log('=== СИСТЕМА VENDHUB УСПЕШНО ЗАПУЩЕНА ===', 'title');
    log(`📊 API URL: ${API_URL}`, 'success');
    log(`🤖 Telegram Bot Token: ${BOT_TOKEN.substring(0, 10)}...`, 'success');
    log(`🔗 Webhook URL: ${WEBHOOK_URL}`, 'success');
    log('', 'info');
    log('Для остановки системы нажмите Ctrl+C', 'info');
    
  } catch (error) {
    log(`❌ Ошибка запуска системы: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Запуск системы
startSystem();
