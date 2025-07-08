// Загружаем переменные окружения
require('dotenv').config();

// Проверяем DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set!');
  process.exit(1);
}

console.log('Starting VHM24 Gateway...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT || 8000);

// Запускаем gateway
require('./services/gateway/src/index.js');
