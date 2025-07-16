/**
 * Скрипт для локального запуска Scheduler
 */

// Устанавливаем переменную окружения NODE_ENV в development
process.env.NODE_ENV = 'development';

// Запускаем Scheduler с локальными настройками
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');

// Загружаем основной .env файл
const mainEnv = dotenv.config();
dotenvExpand.expand(mainEnv);

// Загружаем .env.scheduler.local файл с переопределениями для локального Scheduler
const schedulerLocalEnv = dotenv.config({ path: '.env.scheduler.local' });
dotenvExpand.expand(schedulerLocalEnv);

require('./scheduler/index');

console.log('🚀 Scheduler запущен в режиме разработки');
console.log('📡 Scheduler подключен к Redis и готов планировать задачи');
