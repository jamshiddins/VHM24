/**
 * Скрипт для проверки логов Railway после деплоя
 * Запускается командой: node check-railway-logs.js
 */

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
  cyan: '\x1b[36m'
};

// Функция для логирования с цветом
function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

// Функция для проверки наличия Railway CLI
function checkRailwayCLI() {
  try {
    execSync('railway --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    log('❌ Railway CLI не установлен. Установите его с помощью команды: npm install -g @railway/cli', 'red');
    return false;
  }
}

// Функция для проверки авторизации в Railway
function checkRailwayAuth() {
  try {
    execSync('railway whoami', { stdio: 'ignore' });
    return true;
  } catch (error) {
    log('❌ Вы не авторизованы в Railway. Авторизуйтесь с помощью команды: railway login', 'red');
    return false;
  }
}

// Функция для получения логов Railway
function getRailwayLogs(service = 'web', lines = 100) {
  try {
    // Проверяем, работаем ли мы на Windows
    const isWindows = process.platform === 'win32';
    
    // Формируем команду с учетом особенностей Windows и новой версии Railway CLI
    const command = isWindows 
      ? `railway logs --service ${service} --limit ${lines}`
      : `railway logs --service ${service} --limit ${lines}`;
    
    const output = execSync(command).toString();
    return output;
  } catch (error) {
    log(`❌ Ошибка при получении логов Railway: ${error.message}`, 'red');
    
    // Пробуем старый синтаксис
    try {
      const fallbackCommand = `railway logs -s ${service} -n ${lines}`;
      const output = execSync(fallbackCommand).toString();
      return output;
    } catch (fallbackError) {
      log(`❌ Не удалось получить логи Railway: ${fallbackError.message}`, 'red');
      return '';
    }
  }
}

// Функция для анализа логов на наличие ошибок, связанных с переменными окружения
function analyzeLogsForEnvErrors(logs) {
  const envErrorPatterns = [
    'process.env',
    'undefined variable',
    'cannot read property',
    'is not defined',
    'missing required',
    'environment variable',
    'env var',
    'dotenv',
    'DATABASE_URL',
    'REDIS_URL',
    'JWT_SECRET',
    'TELEGRAM_BOT_TOKEN',
    'S3_ACCESS_KEY',
    'S3_SECRET_KEY'
  ];
  
  const errors = [];
  const lines = logs.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    // Проверка на наличие ошибок, связанных с переменными окружения
    if (line.includes('error') || line.includes('exception') || line.includes('fail')) {
      for (const pattern of envErrorPatterns) {
        if (line.includes(pattern.toLowerCase())) {
          errors.push({
            line: i + 1,
            text: lines[i],
            pattern
          });
          break;
        }
      }
    }
  }
  
  return errors;
}

// Функция для сохранения логов в файл
function saveLogsToFile(logs, filename) {
  try {
    // Создаем директорию, если она не существует
    const dir = path.dirname(filename);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filename, logs);
    log(`✅ Логи сохранены в файл: ${filename}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Ошибка при сохранении логов в файл: ${error.message}`, 'red');
    return false;
  }
}

// Функция для проверки логов Railway
function checkRailwayLogs() {
  log('🔍 Проверка логов Railway после деплоя...', 'blue');
  
  // Проверка наличия Railway CLI и авторизации
  if (!checkRailwayCLI() || !checkRailwayAuth()) {
    return;
  }
  
  // Получение логов Railway
  log('📥 Получение логов Railway...', 'blue');
  const logs = getRailwayLogs();
  
  if (!logs) {
    log('❌ Не удалось получить логи Railway', 'red');
    return;
  }
  
  // Сохранение логов в файл
  const logsDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = path.join(logsDir, `railway-logs-${timestamp}.log`);
  saveLogsToFile(logs, filename);
  
  // Анализ логов на наличие ошибок, связанных с переменными окружения
  log('🔍 Анализ логов на наличие ошибок, связанных с переменными окружения...', 'blue');
  const errors = analyzeLogsForEnvErrors(logs);
  
  if (errors.length > 0) {
    log(`❌ Найдено ${errors.length} ошибок, связанных с переменными окружения:`, 'red');
    
    for (const error of errors) {
      log(`  Строка ${error.line}: ${error.text}`, 'red');
      log(`  Паттерн: ${error.pattern}`, 'yellow');
      log('');
    }
    
    log('⚠️ Рекомендации:', 'yellow');
    log('1. Проверьте наличие всех необходимых переменных окружения в Railway', 'yellow');
    log('2. Запустите скрипт setup-railway-variables.js для синхронизации переменных окружения', 'yellow');
    log('3. Проверьте форматы переменных окружения', 'yellow');
    log('4. Перезапустите деплой после исправления ошибок', 'yellow');
  } else {
    log('✅ Ошибок, связанных с переменными окружения, не найдено', 'green');
  }
  
  // Проверка наличия предупреждений
  const warnings = logs.split('\n').filter(line => 
    line.toLowerCase().includes('warn') || 
    line.toLowerCase().includes('warning') || 
    line.toLowerCase().includes('deprecated')
  );
  
  if (warnings.length > 0) {
    log(`⚠️ Найдено ${warnings.length} предупреждений:`, 'yellow');
    
    for (const warning of warnings) {
      log(`  ${warning}`, 'yellow');
    }
  } else {
    log('✅ Предупреждений не найдено', 'green');
  }
  
  log('✅ Проверка логов Railway завершена', 'green');
}

// Запуск проверки логов
checkRailwayLogs();
