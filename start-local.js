/**
 * Скрипт для запуска приложения локально
 * Запускает только сервер Express, без Telegram бота и без подключения к базе данных и Redis
 */

// Загрузка переменных окружения из файла .env
require('dotenv').config();

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Вывод информации о загруженных переменных окружения
console.log('📋 Загружены переменные окружения:');
console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Установлена' : '❌ Отсутствует'}`);
console.log(`REDIS_URL: ${process.env.REDIS_URL ? '✅ Установлена' : '❌ Отсутствует'}`);
console.log(`TELEGRAM_BOT_TOKEN: ${process.env.TELEGRAM_BOT_TOKEN ? '✅ Установлена' : '❌ Отсутствует'}`);
console.log(`PORT: ${process.env.PORT ? '✅ Установлена' : '❌ Отсутствует'}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV ? '✅ Установлена' : '❌ Отсутствует'}`);

// Запуск сервера Express
console.log('🚀 Запуск сервера Express...');
const serverProcess = spawn('node', ['server.js'], {
    stdio: 'inherit',
    env: process.env
});

serverProcess.on('error', (error) => {
    console.error('❌ Ошибка запуска сервера Express:', error.message);
    process.exit(1);
});

// Обработка завершения процесса
process.on('SIGINT', () => {
    serverProcess.kill();
    process.exit(0);
});

console.log('✅ Сервер Express запущен');
console.log(`🌐 Сервер доступен по адресу: http://localhost:${process.env.PORT || 3000}`);
console.log(`🔍 Health check: http://localhost:${process.env.PORT || 3000}/health`);
console.log(`🔍 API health check: http://localhost:${process.env.PORT || 3000}/api/health`);
