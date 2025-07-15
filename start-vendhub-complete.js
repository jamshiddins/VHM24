/**
 * Скрипт для полноценного запуска VendHub системы
 * Запускает API-сервер и Telegram-бота с синхронизацией между ними
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
  const formattedMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
  
  console.log(formattedMessage);
  
  if (type === 'api' && logStreams.apiLogStream) {
    logStreams.apiLogStream.write(formattedMessage + '\n');
  } else if (type === 'bot' && logStreams.botLogStream) {
    logStreams.botLogStream.write(formattedMessage + '\n');
  } else if (logStreams.systemLogStream) {
    logStreams.systemLogStream.write(formattedMessage + '\n');
  }
}

// Функция для запуска API-сервера
function startApiServer() {
  return new Promise((resolve, reject) => {
    log('Запуск API-сервера...', 'system');
    
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
      log(`ERROR: Не удалось запустить API-сервер: ${error.message}`, 'api');
      reject(error);
    });
    
    apiProcess.on('close', (code) => {
      log(`API-сервер завершил работу с кодом ${code}`, 'api');
      isApiReady = false;
    });
    
    // Таймаут на запуск API-сервера
    setTimeout(() => {
      if (!isApiReady) {
        log('WARN: Таймаут запуска API-сервера. Продолжение...', 'system');
        resolve();
      }
    }, 10000);
  });
}

// Функция для запуска Telegram-бота
function startTelegramBot() {
  return new Promise((resolve, reject) => {
    log('Запуск Telegram-бота...', 'system');
    
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
      log(`ERROR: Не удалось запустить Telegram-бота: ${error.message}`, 'bot');
      reject(error);
    });
    
    botProcess.on('close', (code) => {
      log(`Telegram-бот завершил работу с кодом ${code}`, 'bot');
      isBotReady = false;
    });
    
    // Таймаут на запуск Telegram-бота
    setTimeout(() => {
      if (!isBotReady) {
        log('WARN: Таймаут запуска Telegram-бота. Продолжение...', 'system');
        resolve();
      }
    }, 10000);
  });
}

// Функция для проверки работоспособности API
async function checkApiHealth() {
  try {
    log('Проверка работоспособности API...', 'system');
    
    const response = await axios.get(`${API_URL}/api/health`, { timeout: 5000 });
    
    if (response.status === 200) {
      log(`API работает: ${JSON.stringify(response.data)}`, 'system');
      return true;
    } else {
      log(`WARN: API вернул статус ${response.status}`, 'system');
      return false;
    }
  } catch (error) {
    log(`ERROR: Не удалось подключиться к API: ${error.message}`, 'system');
    return false;
  }
}

// Функция для настройки вебхука Telegram
async function setupTelegramWebhook() {
  try {
    log('Настройка вебхука Telegram...', 'system');
    
    const response = await axios.post(`${API_URL}/api/telegram/setWebhook?token=${BOT_TOKEN}`, {
      url: WEBHOOK_URL
    }, { timeout: 5000 });
    
    if (response.data && response.data.success) {
      log(`Вебхук успешно настроен: ${WEBHOOK_URL}`, 'system');
      return true;
    } else {
      log(`WARN: Не удалось настроить вебхук: ${JSON.stringify(response.data)}`, 'system');
      return false;
    }
  } catch (error) {
    log(`ERROR: Ошибка настройки вебхука: ${error.message}`, 'system');
    return false;
  }
}

// Функция для проверки статуса вебхука
async function checkWebhookStatus() {
  try {
    log('Проверка статуса вебхука...', 'system');
    
    const response = await axios.get(`${API_URL}/api/telegram/status?token=${BOT_TOKEN}`, { timeout: 5000 });
    
    if (response.data && response.data.success) {
      log(`Статус вебхука: ${JSON.stringify(response.data.telegramResponse)}`, 'system');
      return true;
    } else {
      log(`WARN: Не удалось получить статус вебхука: ${JSON.stringify(response.data)}`, 'system');
      return false;
    }
  } catch (error) {
    log(`ERROR: Ошибка проверки статуса вебхука: ${error.message}`, 'system');
    return false;
  }
}

// Функция для мониторинга и перезапуска компонентов
function startMonitoring() {
  log('Запуск мониторинга компонентов...', 'system');
  
  // Проверка API каждые 30 секунд
  const apiCheckInterval = setInterval(async () => {
    if (!isApiReady) {
      log('WARN: API не работает, перезапуск...', 'system');
      await startApiServer();
    } else {
      const isHealthy = await checkApiHealth();
      if (!isHealthy) {
        log('WARN: API не отвечает, перезапуск...', 'system');
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
      log('WARN: Telegram-бот не работает, перезапуск...', 'system');
      await startTelegramBot();
    }
  }, 30000);
  
  // Проверка вебхука каждые 5 минут
  const webhookCheckInterval = setInterval(async () => {
    if (isApiReady && isBotReady) {
      const isWebhookOk = await checkWebhookStatus();
      if (!isWebhookOk) {
        log('WARN: Вебхук не работает, переустановка...', 'system');
        await setupTelegramWebhook();
      }
    }
  }, 300000);
  
  // Обработка завершения работы
  process.on('SIGINT', () => {
    log('Получен сигнал SIGINT, завершение работы...', 'system');
    shutdown(apiCheckInterval, botCheckInterval, webhookCheckInterval);
  });
  
  process.on('SIGTERM', () => {
    log('Получен сигнал SIGTERM, завершение работы...', 'system');
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
    log('Остановка API-сервера...', 'system');
    apiProcess.kill();
  }
  
  // Остановка Telegram-бота
  if (botProcess) {
    log('Остановка Telegram-бота...', 'system');
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
  
  log('Система VendHub успешно остановлена', 'system');
  process.exit(0);
}

// Создание потоков логов
const logStreams = createLogStreams();

// Главная функция запуска системы
async function startSystem() {
  try {
    log('Запуск системы VendHub...', 'system');
    
    // Запуск API-сервера
    await startApiServer();
    
    // Проверка работоспособности API
    const isApiHealthy = await checkApiHealth();
    if (!isApiHealthy) {
      log('WARN: API не отвечает, но продолжаем запуск...', 'system');
    }
    
    // Запуск Telegram-бота
    await startTelegramBot();
    
    // Настройка вебхука
    if (isApiReady) {
      await setupTelegramWebhook();
      await checkWebhookStatus();
    }
    
    // Запуск мониторинга
    startMonitoring();
    
    log('✅ Система VendHub успешно запущена', 'system');
    log(`📊 API URL: ${API_URL}`, 'system');
    log(`🤖 Telegram Bot Token: ${BOT_TOKEN.substring(0, 10)}...`, 'system');
    log(`🔗 Webhook URL: ${WEBHOOK_URL}`, 'system');
    
  } catch (error) {
    log(`❌ Ошибка запуска системы: ${error.message}`, 'system');
    process.exit(1);
  }
}

// Запуск системы
startSystem();
