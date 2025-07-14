#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

console.log('🤖 Запуск VendHub Telegram Bot...');

const bot = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'apps/telegram-bot'),
    stdio: 'inherit'
});

bot.on('close', (code) => {
    console.log(`Telegram Bot завершен с кодом ${code}`);
});
