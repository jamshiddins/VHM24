const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const dotenv = require('dotenv');

// Загрузка переменных окружения
dotenv.config({ path: '.env.development' });

// Цвета для логов
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// Функция для логирования
function log(type, message) {
  const timestamp = new Date().toISOString();
  let prefix = '';
  
  switch (type) {
    case 'INFO':
      prefix = `${colors.blue}[${timestamp}] [INFO]${colors.reset}`;
      break;
    case 'SUCCESS':
      prefix = `${colors.green}[${timestamp}] [SUCCESS]${colors.reset}`;
      break;
    case 'WARNING':
      prefix = `${colors.yellow}[${timestamp}] [WARNING] WARN:${colors.reset}`;
      break;
    case 'ERROR':
      prefix = `${colors.red}[${timestamp}] [ERROR]${colors.reset}`;
      break;
    case 'TITLE':
      prefix = `${colors.magenta}[${timestamp}] [TITLE]${colors.reset}`;
      break;
    case 'API':
      prefix = `${colors.cyan}[${timestamp}] [API]${colors.reset}`;
      break;
    case 'BOT':
      prefix = `${colors.green}[${timestamp}] [BOT]${colors.reset}`;
      break;
    default:
      prefix = `${colors.white}[${timestamp}]${colors.reset}`;
  }
  
  console.log(`${prefix} ${message}`);
}

// Функция для создания временного файла .env для SQLite
function createSqliteEnvFile() {
  const sqliteEnvContent = `
# Настройки базы данных SQLite
DATABASE_URL="file:./dev.db"

# Настройки Redis
REDIS_URL="redis://localhost:6379"

# Настройки Telegram бота
TELEGRAM_BOT_TOKEN="${process.env.TELEGRAM_BOT_TOKEN || '1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ'}"

# Настройки API
API_BASE_URL="http://localhost:8000"
PORT=8000

# Настройки JWT
JWT_SECRET="vhm24-secret-key-for-development"

# Настройки S3/DigitalOcean Spaces
S3_BUCKET_NAME="vendhub-storage"
S3_ACCESS_KEY="your-access-key"
S3_SECRET_KEY="your-secret-key"
S3_ENDPOINT="https://fra1.digitaloceanspaces.com"

# Режим работы
NODE_ENV="development"
SKIP_DATABASE=true
  `;
  
  // Создаем файл .env в директории backend
  fs.writeFileSync(path.join(__dirname, 'backend', '.env'), sqliteEnvContent);
  log('INFO', 'Создан временный файл .env для SQLite в директории backend');
  
  // Создаем файл .env в корневой директории
  fs.writeFileSync(path.join(__dirname, '.env'), sqliteEnvContent);
  log('INFO', 'Создан временный файл .env для SQLite в корневой директории');
  
  // Создаем файл .env в директории telegram-bot
  fs.writeFileSync(path.join(__dirname, 'telegram-bot', '.env'), sqliteEnvContent);
  log('INFO', 'Создан временный файл .env для SQLite в директории telegram-bot');
}

// Функция для запуска процесса
function startProcess(command, args, name, options = {}) {
  return new Promise((resolve, reject) => {
    log('INFO', `Запуск ${name}...`);
    
    const process = spawn(command, args, options);
    
    process.stdout.on('data', (data) => {
      log(name.toUpperCase(), data.toString().trim());
    });
    
    process.stderr.on('data', (data) => {
      log(name.toUpperCase(), `ERROR: ${data.toString().trim()}`);
    });
    
    process.on('close', (code) => {
      if (code !== 0) {
        log(name.toUpperCase(), `${name} завершил работу с кодом ${code}`);
        reject(new Error(`${name} завершил работу с кодом ${code}`));
      } else {
        log('SUCCESS', `${name} успешно запущен`);
        resolve();
      }
    });
    
    // Возвращаем процесс для возможности его остановки
    return process;
  });
}

// Основная функция запуска
async function startVendHub() {
  try {
    log('TITLE', 'Запуск VendHub с SQLite (локальный режим)...');
    
    // Создаем временные файлы .env для SQLite
    createSqliteEnvFile();
    
    // Запускаем Telegram-бот
    const botProcess = startProcess('node', ['telegram-bot/src/bot.js'], 'Telegram-бот', {
      env: { ...process.env, SKIP_DATABASE: 'true' }
    });
    
    // Запускаем мониторинг компонентов
    setTimeout(() => {
      log('INFO', 'Запуск мониторинга компонентов...');
      log('SUCCESS', 'Система успешно запущена и готова к работе!');
    }, 10000);
    
    // Обработка сигналов завершения
    process.on('SIGINT', () => {
      log('INFO', 'Получен сигнал SIGINT, завершение работы...');
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      log('INFO', 'Получен сигнал SIGTERM, завершение работы...');
      process.exit(0);
    });
    
  } catch (error) {
    log('ERROR', `Ошибка запуска системы: ${error.message}`);
    process.exit(1);
  }
}

// Запускаем систему
startVendHub();
