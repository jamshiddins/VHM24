/**
 * Скрипт для локального запуска Scheduler
 */

// Устанавливаем переменную окружения NODE_ENV в development
process.env.NODE_ENV = 'development';

// Запускаем Scheduler с локальными настройками
require('dotenv').config({ path: '.env.scheduler.local' });
require('./scheduler/index');

console.log('🚀 Scheduler запущен в режиме разработки');
console.log('📡 Scheduler подключен к Redis и готов планировать задачи');
