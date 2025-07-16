/**
 * Скрипт для валидации переменных окружения при запуске приложения
 * Запускается автоматически при старте приложения
 */

const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');

// Загружаем основной .env файл
const mainEnv = dotenv.config();
dotenvExpand.expand(mainEnv);
const logger = require('./backend/src/utils/logger');

// Список обязательных переменных окружения
const requiredVariables = [
  'DATABASE_URL',
  'JWT_SECRET',
  'TELEGRAM_BOT_TOKEN',
  'REDIS_URL',
  'PORT',
  'NODE_ENV',
  'RAILWAY_PUBLIC_URL',
  'WEBHOOK_URL',
  'S3_ACCESS_KEY',
  'S3_SECRET_KEY',
  'S3_BUCKET_NAME',
  'S3_ENDPOINT',
  'S3_REGION'
];

// Список опциональных переменных окружения
const optionalVariables = [
  'RAILWAY_PUBLIC_DOMAIN',
  'ADMIN_IDS',
  'S3_BACKUP_BUCKET',
  'S3_UPLOAD_URL',
  'S3_BACKUP_URL',
  'CORS_ORIGIN',
  'LOG_LEVEL',
  'MULTIKASSA_API_URL',
  'MULTIKASSA_API_KEY',
  'PAYME_API_URL',
  'PAYME_API_KEY',
  'CLICK_API_KEY',
  'UZUM_API_KEY',
  'METRICS_ENABLED'
];

// Валидация переменных окружения
function validateEnvironmentVariables() {
  const missingVariables = [];
  
  // Проверка обязательных переменных
  for (const variable of requiredVariables) {
    if (!process.env[variable]) {
      missingVariables.push(variable);
    }
  }
  
  // Вывод результатов проверки
  if (missingVariables.length > 0) {
    logger.error(`❌ Отсутствуют обязательные переменные окружения: ${missingVariables.join(', ')}`);
    return false;
  }
  
  // Проверка опциональных переменных
  const missingOptionalVariables = [];
  for (const variable of optionalVariables) {
    if (!process.env[variable]) {
      missingOptionalVariables.push(variable);
    }
  }
  
  if (missingOptionalVariables.length > 0) {
    logger.warn(`⚠️ Отсутствуют опциональные переменные окружения: ${missingOptionalVariables.join(', ')}`);
  }
  
  // Проверка формата DATABASE_URL
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://')) {
    logger.error('❌ Неверный формат DATABASE_URL. Должен начинаться с postgresql://');
    return false;
  }
  
  // Проверка формата REDIS_URL
  if (process.env.REDIS_URL && !process.env.REDIS_URL.startsWith('redis://')) {
    logger.error('❌ Неверный формат REDIS_URL. Должен начинаться с redis://');
    return false;
  }
  
  // Проверка длины JWT_SECRET
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    logger.warn('⚠️ JWT_SECRET слишком короткий. Рекомендуется использовать ключ длиной не менее 32 символов');
  }
  
  // Проверка формата WEBHOOK_URL
  if (process.env.WEBHOOK_URL && !process.env.WEBHOOK_URL.startsWith('https://')) {
    logger.error('❌ Неверный формат WEBHOOK_URL. Должен начинаться с https://');
    return false;
  }
  
  // Проверка формата S3_ENDPOINT
  if (process.env.S3_ENDPOINT && !process.env.S3_ENDPOINT.startsWith('https://')) {
    logger.error('❌ Неверный формат S3_ENDPOINT. Должен начинаться с https://');
    return false;
  }
  
  logger.info('✅ Все обязательные переменные окружения настроены корректно');
  return true;
}

// Экспорт функции валидации
module.exports = validateEnvironmentVariables;

// Если скрипт запущен напрямую, выполняем валидацию
if (require.main === module) {
  const isValid = validateEnvironmentVariables();
  if (!isValid) {
    process.exit(1);
  }
}
