#!/usr/bin/env node
/**
 * Скрипт для запуска всей системы VendHub
 * Запускает backend, worker, scheduler и telegram-бот
 */
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Запуск системы VendHub...');

// Запуск backend
console.log('📡 Запуск Backend API...');
const backend = spawn('node', ['start-backend.js'], {
    cwd: __dirname,
    stdio: 'inherit'
});

// Запуск worker через 2 секунды
setTimeout(() => {
    console.log('🔄 Запуск Worker...');
    const worker = spawn('npm', ['run', 'start:worker'], {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
    });

    worker.on('close', (code) => {
        console.log(`🛑 Worker завершил работу с кодом ${code}`);
    });
}, 2000);

// Запуск scheduler через 4 секунды
setTimeout(() => {
    console.log('⏰ Запуск Scheduler...');
    const scheduler = spawn('npm', ['run', 'start:scheduler'], {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
    });

    scheduler.on('close', (code) => {
        console.log(`🛑 Scheduler завершил работу с кодом ${code}`);
    });
}, 4000);

// Запуск telegram bot через 6 секунд
setTimeout(() => {
    console.log('🤖 Запуск Telegram-бота...');
    const bot = spawn('node', ['start-bot.js'], {
        cwd: __dirname,
        stdio: 'inherit'
    });

    bot.on('close', (code) => {
        console.log(`🛑 Telegram-бот завершил работу с кодом ${code}`);
    });
}, 6000);

// Обработка сигналов завершения
process.on('SIGINT', () => {
    console.log('👋 Получен сигнал SIGINT, завершение работы системы...');
    backend.kill('SIGINT');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('👋 Получен сигнал SIGTERM, завершение работы системы...');
    backend.kill('SIGTERM');
    process.exit(0);
});

console.log('✅ Система VendHub запущена');
