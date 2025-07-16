/**
 * Скрипт для локального запуска Worker
 */

// Устанавливаем переменную окружения NODE_ENV в development
process.env.NODE_ENV = 'development';

// Запускаем Worker с локальными настройками
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');

// Загружаем основной .env файл
const mainEnv = dotenv.config();
dotenvExpand.expand(mainEnv);

// Загружаем .env.worker.local файл с переопределениями для локального Worker
const workerLocalEnv = dotenv.config({ path: '.env.worker.local' });
dotenvExpand.expand(workerLocalEnv);

require('./worker/index');

console.log('🚀 Worker запущен в режиме разработки');
console.log('📡 Worker подключен к Redis и готов обрабатывать задачи');
