#!/usr/bin/env node
/**
 * Скрипт для запуска Telegram-бота
 */
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Запуск Telegram-бота...');

const bot = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'telegram-bot'),
    stdio: 'inherit'
});

bot.on('close', (code) => {
    console.log(`🛑 Telegram-бот завершил работу с кодом ${code}`);
    process.exit(code);
});

process.on('SIGINT', () => {
    console.log('👋 Получен сигнал SIGINT, завершение работы Telegram-бота...');
    bot.kill('SIGINT');
});

process.on('SIGTERM', () => {
    console.log('👋 Получен сигнал SIGTERM, завершение работы Telegram-бота...');
    bot.kill('SIGTERM');
});
