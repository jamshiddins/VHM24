/**
 * Скрипт для запуска системы в production
 * Запускается командой: npm run start:prod
 */

require('dotenv').config();
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Проверка переменных окружения
const validateEnvironmentVariables = require('./check-env-variables');
const isValid = validateEnvironmentVariables();

if (!isValid) {
  console.error(`❌ Проверка переменных окружения не пройдена. Смотрите логи для подробностей.`);
  process.exit(1);
}

// Проверка, что мы в production
if (process.env.NODE_ENV !== 'production') {
  console.warn(`⚠️ Внимание: Запуск в режиме ${process.env.NODE_ENV}, а не production`);
}

// Создание директории для логов
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Создание потоков для логов
const serverLogStream = fs.createWriteStream(path.join(logDir, 'server.log'), { flags: 'a' });
const botLogStream = fs.createWriteStream(path.join(logDir, 'bot.log'), { flags: 'a' });

/**
 * Запуск процесса с логированием
 */
function startProcess(command, args, name, logStream) {
  console.log(`🚀 Запуск ${name}...`);
  
  const process = spawn(command, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true
  });
  
  // Логирование stdout
  process.stdout.on('data', (data) => {
    const message = data.toString().trim();
    const timestamp = new Date().toISOString();
    logStream.write(`[${timestamp}] [INFO] ${message}\n`);
    console.log(`[${name}] ${message}`);
  });
  
  // Логирование stderr
  process.stderr.on('data', (data) => {
    const message = data.toString().trim();
    const timestamp = new Date().toISOString();
    logStream.write(`[${timestamp}] [ERROR] ${message}\n`);
    console.error(`[${name}] ❌ ${message}`);
  });
  
  // Обработка завершения процесса
  process.on('close', (code) => {
    const timestamp = new Date().toISOString();
    const message = `Процесс ${name} завершился с кодом ${code}`;
    logStream.write(`[${timestamp}] [INFO] ${message}\n`);
    console.log(`[${name}] ${message}`);
    
    // Перезапуск процесса при ошибке
    if (code !== 0) {
      const restartMessage = `Перезапуск ${name}...`;
      logStream.write(`[${timestamp}] [INFO] ${restartMessage}\n`);
      console.log(`[${name}] ${restartMessage}`);
      
      // Перезапуск через 5 секунд
      setTimeout(() => {
        startProcess(command, args, name, logStream);
      }, 5000);
    }
  });
  
  return process;
}

/**
 * Запуск всей системы
 */
function startSystem() {
  console.log('🚀 Запуск системы в production...');
  console.log('📅 Время:', new Date().toISOString());
  console.log('🌐 Окружение:', process.env.NODE_ENV);
  console.log('🔗 Порт:', process.env.PORT);
  console.log('-----------------------------------');
  
  // Запуск сервера
  const serverProcess = startProcess('node', ['server.js'], 'Server', serverLogStream);
  
  // Запуск Telegram бота
  const botProcess = startProcess('node', ['apps/telegram-bot/src/index.js'], 'Telegram Bot', botLogStream);
  
  // Обработка сигналов завершения
  process.on('SIGINT', () => {
    console.log('👋 Получен сигнал SIGINT, завершение работы...');
    serverProcess.kill();
    botProcess.kill();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('👋 Получен сигнал SIGTERM, завершение работы...');
    serverProcess.kill();
    botProcess.kill();
    process.exit(0);
  });
}

// Запуск системы
startSystem();
