/**
 * Скрипт для локального запуска Worker
 */

// Устанавливаем переменную окружения NODE_ENV в development
process.env.NODE_ENV = 'development';

// Запускаем Worker с локальными настройками
require('dotenv').config({ path: '.env.worker.local' });
require('./worker/index');

console.log('🚀 Worker запущен в режиме разработки');
console.log('📡 Worker подключен к Redis и готов обрабатывать задачи');
