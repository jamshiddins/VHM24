#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Запуск полной системы VendHub...');

// Запуск backend
const backend = spawn('node', ['start-backend.js'], {
    stdio: 'inherit'
});

// Запуск telegram bot через 3 секунды
setTimeout(() => {
    const bot = spawn('node', ['start-bot.js'], {
        stdio: 'inherit'
    });
}, 3000);

console.log('✅ Система запущена!');
console.log('📊 Backend: process.env.API_URL');
console.log('🤖 Telegram Bot: активен');
