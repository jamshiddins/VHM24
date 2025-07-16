/**
 * Скрипт для проверки переменных окружения в Railway
 */
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');

// Загружаем основной .env файл
const mainEnv = dotenv.config();
dotenvExpand.expand(mainEnv);

// Список переменных из финальной версии
const finalVariables = [
  // Основные системные переменные
  'DATABASE_URL',
  'CORS_ORIGIN',
  'JWT_SECRET',
  'LOG_LEVEL',
  'NODE_ENV',
  'PORT',
  'REDIS_URL',
  'TELEGRAM_BOT_TOKEN',
  'WEBHOOK_URL',
  'ADMIN_IDS',
  
  // Railway Project
  'RAILWAY_PROJECT_ID',
  'RAILWAY_PUBLIC_URL',
  'RAILWAY_PUBLIC_DOMAIN',
  
  // API / App URLs
  'API_URL',
  
  // DigitalOcean Spaces
  'S3_ACCESS_KEY',
  'S3_SECRET_KEY',
  'S3_REGION',
  'S3_BUCKET_NAME',
  'S3_BACKUP_BUCKET',
  'S3_ENDPOINT',
  'S3_UPLOAD_URL',
  'S3_BACKUP_URL',
  
  // Платёжные шлюзы
  'MULTIKASSA_API_URL',
  'PAYME_API_KEY',
  'CLICK_API_KEY',
  'UZUM_API_KEY',
  
  // Метрики и мониторинг
  'METRICS_ENABLED'
];

// Функция для проверки переменных окружения
function checkEnvironmentVariables() {
  console.log('=== ПРОВЕРКА ПЕРЕМЕННЫХ ОКРУЖЕНИЯ ===');
  console.log('Проверка наличия переменных окружения из финальной версии:');
  console.log('');
  
  const missingVariables = [];
  
  // Проверка наличия переменных окружения
  for (const variable of finalVariables) {
    if (process.env[variable]) {
      console.log(`✅ ${variable}: ${process.env[variable].substring(0, 10)}${process.env[variable].length > 10 ? '...' : ''}`);
    } else {
      console.log(`❌ ${variable}: отсутствует`);
      missingVariables.push(variable);
    }
  }
  
  console.log('');
  
  // Вывод результатов проверки
  if (missingVariables.length > 0) {
    console.log(`❌ Отсутствуют переменные окружения: ${missingVariables.join(', ')}`);
    console.log(`Всего отсутствует: ${missingVariables.length} из ${finalVariables.length}`);
  } else {
    console.log('✅ Все переменные окружения из финальной версии присутствуют');
  }
  
  console.log('');
  console.log(`Всего проверено: ${finalVariables.length} переменных окружения`);
  console.log('=== ПРОВЕРКА ЗАВЕРШЕНА ===');
}

// Запуск проверки
checkEnvironmentVariables();
