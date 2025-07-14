#!/usr/bin/env node

/**
 * Скрипт запуска VHM24 в продакшене
 */

// Загрузка переменных окружения из файла .env
require('dotenv').config();

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Проверка наличия переменных окружения
const requiredEnvVars = [
    'DATABASE_URL',
    'PORT',
    'NODE_ENV',
    'TELEGRAM_BOT_TOKEN'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
    console.error('❌ Отсутствуют необходимые переменные окружения:', missingVars.join(', '));
    console.error('Пожалуйста, создайте файл .env или установите переменные окружения');
    process.exit(1);
}

// Вывод информации о конфигурации
console.log('📊 Конфигурация:');
console.log(`- DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Настроен' : '❌ Отсутствует'}`);
console.log(`- REDIS_URL: ${process.env.REDIS_URL ? '✅ Настроен' : '❌ Отсутствует'}`);
console.log(`- TELEGRAM_BOT_TOKEN: ${process.env.TELEGRAM_BOT_TOKEN ? '✅ Настроен' : '❌ Отсутствует'}`);
console.log(`- RAILWAY_PUBLIC_URL: ${process.env.RAILWAY_PUBLIC_URL}`);
console.log(`- PORT: ${process.env.PORT}`);
console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);

// Запуск бэкенда
console.log('🚀 Запуск бэкенда...');
const backendProcess = spawn('node', ['backend/src/index.js'], {
    stdio: 'inherit',
    env: process.env
});

backendProcess.on('error', (error) => {
    console.error('❌ Ошибка запуска бэкенда:', error.message);
    process.exit(1);
});

// Запуск Telegram бота
console.log('🤖 Запуск Telegram бота...');
const telegramProcess = spawn('node', ['apps/telegram-bot/src/index.js'], {
    stdio: 'inherit',
    env: process.env
});

telegramProcess.on('error', (error) => {
    console.error('❌ Ошибка запуска Telegram бота:', error.message);
});

// Обработка завершения процесса
process.on('SIGINT', () => {
    console.log('⏹️ Завершение работы...');
    backendProcess.kill();
    telegramProcess.kill();
    process.exit(0);
});

console.log('✅ VHM24 успешно запущен в продакшене');
