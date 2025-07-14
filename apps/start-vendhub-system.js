#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');



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




