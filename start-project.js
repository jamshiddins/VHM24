#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Запуск VHM24 проекта...\n');

// Проверяем наличие .env файла
if (!fs.existsSync('.env')) {
  console.error('❌ Файл .env не найден!');
  console.log('Скопируйте .env.example в .env и заполните переменные.');
  process.exit(1);
}

// Проверяем наличие backend папки
if (!fs.existsSync('backend')) {
  console.error('❌ Backend папка не найдена!');
  console.log('Запустите: node create-monolith-backend.js');
  process.exit(1);
}

// Функция для запуска процесса
function startProcess(command, args, cwd, name) {
  console.log(`📦 Запуск ${name}...`);

  const proc = spawn(command, args, {
    cwd: path.join(__dirname, cwd),
    shell: true,
    stdio: 'inherit'
  });

  proc.on('error', error => {
    console.error(`❌ Ошибка запуска ${name}:`, error);
  });

  proc.on('exit', code => {
    if (code !== 0) {
      console.error(`❌ ${name} завершился с кодом ${code}`);
    }
  });

  return proc;
}

// Запускаем backend
const backend = startProcess('npm', ['start'], 'backend', 'Backend API');

// Ждем немного перед запуском frontend
setTimeout(() => {
  // Запускаем frontend
  const frontend = startProcess(
    'npm',
    ['run', 'dev'],
    'apps/web-dashboard',
    'Web Dashboard'
  );

  console.log('\n✅ Все компоненты запущены!');
  console.log('\n📍 Доступ к системе:');
  console.log('   Web Dashboard: http://localhost:3000');
  console.log('   Backend API: http://localhost:8000');
  console.log('   Health Check: http://localhost:8000/health');
  console.log('\n💡 Для остановки нажмите Ctrl+C');
}, 3000);

// Обработка завершения
process.on('SIGINT', () => {
  console.log('\n🛑 Остановка всех сервисов...');
  process.exit(0);
});
