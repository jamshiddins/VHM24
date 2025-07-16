#!/usr/bin/env node
/**
 * Скрипт для установки переменных окружения для сервисов worker и scheduler в Railway
 * Запускается командой: node set-railway-service-env.js
 */

require('dotenv').config();
const { execSync } = require('child_process');

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

// Функция для установки переменных окружения для сервиса в Railway
function setServiceEnvironmentVariables(serviceName) {
  try {
    log(`Установка переменных окружения для сервиса ${serviceName}...`, 'info');
    
    // Список необходимых переменных окружения
    const requiredVariables = [
      'DATABASE_URL',
      'DATABASE_URL_PUBLIC',
      'REDIS_URL',
      'REDIS_URL_PUBLIC',
      'NODE_ENV',
      'PORT',
      'RAILWAY_PUBLIC_URL',
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
    
    // Установка переменных окружения для сервиса
    for (const variable of requiredVariables) {
      if (process.env[variable]) {
        try {
          executeCommand(`railway variables --service ${serviceName} --set "${variable}=${process.env[variable]}"`);
          log(`✅ Установлена переменная окружения ${variable} для сервиса ${serviceName}`, 'success');
        } catch (error) {
          log(`❌ Ошибка при установке переменной окружения ${variable} для сервиса ${serviceName}: ${error.message}`, 'error');
        }
      } else {
        log(`⚠️ Переменная окружения ${variable} отсутствует в .env`, 'warning');
      }
    }
    
    return true;
  } catch (error) {
    log(`❌ Ошибка при установке переменных окружения для сервиса ${serviceName}: ${error.message}`, 'error');
    return false;
  }
}

// Главная функция
function main() {
  log('=== УСТАНОВКА ПЕРЕМЕННЫХ ОКРУЖЕНИЯ ДЛЯ СЕРВИСОВ В RAILWAY ===', 'title');
  
  try {
    // Установка переменных окружения для сервиса worker
    const workerEnvSet = setServiceEnvironmentVariables('worker');
    
    if (!workerEnvSet) {
      log('❌ Не удалось установить переменные окружения для сервиса worker', 'error');
    }
    
    // Установка переменных окружения для сервиса scheduler
    const schedulerEnvSet = setServiceEnvironmentVariables('scheduler');
    
    if (!schedulerEnvSet) {
      log('❌ Не удалось установить переменные окружения для сервиса scheduler', 'error');
    }
    
    // Вывод итогового результата
    log('=== ИТОГОВЫЙ РЕЗУЛЬТАТ ===', 'title');
    
    if (workerEnvSet && schedulerEnvSet) {
      log('✅ Переменные окружения успешно установлены для сервисов worker и scheduler', 'success');
    } else if (workerEnvSet) {
      log('✅ Переменные окружения успешно установлены только для сервиса worker', 'warning');
    } else if (schedulerEnvSet) {
      log('✅ Переменные окружения успешно установлены только для сервиса scheduler', 'warning');
    } else {
      log('❌ Не удалось установить переменные окружения для сервисов', 'error');
    }
    
    log('', 'info');
    log('Для перезапуска сервисов выполните команду:', 'info');
    log('railway up', 'info');
  } catch (error) {
    log(`❌ Критическая ошибка: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Запуск скрипта
main();
