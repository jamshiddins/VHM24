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

// Запуск бэкенда
const backendProcess = spawn('node', ['backend/src/index.js'], {
    stdio: 'inherit',
    env: process.env
});

backendProcess.on('error', (error) => {
    console.error('❌ Ошибка запуска бэкенда:', error.message);
    process.exit(1);
});

// Запуск Telegram бота
const telegramProcess = spawn('node', ['apps/telegram-bot/src/index.js'], {
    stdio: 'inherit',
    env: process.env
});

telegramProcess.on('error', (error) => {
    console.error('❌ Ошибка запуска Telegram бота:', error.message);
});

// Обработка завершения процесса
process.on('SIGINT', () => {
    backendProcess.kill();
    telegramProcess.kill();
    process.exit(0);
});