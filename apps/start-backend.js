#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Запуск VendHub Backend...');

const backend = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'backend'),
    stdio: 'inherit'
});

backend.on('close', (code) => {
    console.log(`Backend завершен с кодом ${code}`);
});
