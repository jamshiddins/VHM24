/**
 * Скрипт для локального запуска API сервера
 */

// Устанавливаем переменную окружения NODE_ENV в development
process.env.NODE_ENV = 'development';

// Запускаем API сервер с локальными настройками
require('dotenv').config({ path: '.env.api.local' });
require('./api/index');

console.log('🚀 API сервер запущен в режиме разработки');
console.log(`📡 Сервер доступен по адресу: http://localhost:${process.env.PORT || 3000}`);
console.log('🔍 Health check: http://localhost:3000/health');
