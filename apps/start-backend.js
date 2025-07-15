#!/usr/bin/env node
/**
 * Скрипт для запуска Backend API
 */
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Запуск Backend API...');

const backend = spawn('npm', ['start'], {
    cwd: path.join(__dirname, '..', 'backend'),
    stdio: 'inherit'
});

backend.on('close', (code) => {
    console.log(`🛑 Backend API завершил работу с кодом ${code}`);
    process.exit(code);
});

process.on('SIGINT', () => {
    console.log('👋 Получен сигнал SIGINT, завершение работы Backend API...');
    backend.kill('SIGINT');
});

process.on('SIGTERM', () => {
    console.log('👋 Получен сигнал SIGTERM, завершение работы Backend API...');
    backend.kill('SIGTERM');
});
