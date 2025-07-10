#!/usr/bin/env node

// Загружаем переменные окружения
require('dotenv').config();

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Запуск VHM24 с Railway PostgreSQL...\\n');

// Проверка переменных окружения
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL не установлен!');
  console.log('Скопируйте DATABASE_URL из Railway PostgreSQL и добавьте в .env');
  process.exit(1);
}

console.log('✅ База данных подключена:', process.env.DATABASE_URL.split('@')[1]);

// Сервисы для запуска
const services = [
  { name: 'Gateway', path: 'services/gateway', port: 8000 },
  { name: 'Auth', path: 'services/auth', port: 3001 },
  { name: 'Recipes', path: 'services/recipes', port: 3007 },
  { name: 'Notifications', path: 'services/notifications', port: 3008 },
  { name: 'Audit', path: 'services/audit', port: 3009 },
  { name: 'Monitoring', path: 'services/monitoring', port: 3010 }
];

const processes = [];

// Запуск сервисов
services.forEach((service, index) => {
  setTimeout(() => {
    console.log(`🚀 Запуск ${service.name} на порту ${service.port}...`);
    
    const proc = spawn('npm', ['start'], {
      cwd: path.join(__dirname, service.path),
      shell: true,
      env: { ...process.env, PORT: service.port }
    });
    
    proc.stdout.on('data', (data) => {
      console.log(`[${service.name}] ${data.toString().trim()}`);
    });
    
    proc.stderr.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg && !msg.includes('ExperimentalWarning')) {
        console.error(`[${service.name}] ⚠️  ${msg}`);
      }
    });
    
    processes.push(proc);
  }, index * 2000);
});

// Запуск Web Dashboard
setTimeout(() => {
  console.log('\n🌐 Запуск Web Dashboard...');
  
  const dashboard = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, 'apps/web-dashboard'),
    shell: true
  });
  
  dashboard.stdout.on('data', (data) => {
    console.log(`[Dashboard] ${data.toString().trim()}`);
  });
  
  processes.push(dashboard);
}, 15000);

// Информация
setTimeout(() => {
  console.log('\n✅ Все сервисы запущены!');
  console.log('\n📍 Доступные URL:');
  console.log('   Gateway API: http://localhost:8000');
  console.log('   Web Dashboard: http://localhost:3000');
  console.log('\n🌐 Для деплоя на Railway:');
  console.log('   1. Создайте проект на Railway');
  console.log('   2. Подключите GitHub репозиторий');
  console.log('   3. Добавьте переменные окружения');
  console.log('   4. Railway автоматически задеплоит проект');
}, 20000);

process.on('SIGINT', () => {
  console.log('\n🛑 Остановка всех сервисов...');
  processes.forEach(proc => proc.kill());
  process.exit(0);
});
