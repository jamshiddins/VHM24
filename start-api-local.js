/**
 * Скрипт для локального запуска API сервера
 */

// Устанавливаем переменную окружения NODE_ENV в development
process.env.NODE_ENV = 'development';

// Запускаем API сервер с локальными настройками
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');

// Загружаем основной .env файл
const mainEnv = dotenv.config();
dotenvExpand.expand(mainEnv);

// Загружаем .env.api.local файл с переопределениями для локального API сервера
const apiLocalEnv = dotenv.config({ path: '.env.api.local' });
dotenvExpand.expand(apiLocalEnv);

require('./api/index');

console.log('🚀 API сервер запущен в режиме разработки');
console.log(`📡 Сервер доступен по адресу: http://localhost:${process.env.PORT || 3000}`);
console.log('🔍 Health check: http://localhost:3000/health');
