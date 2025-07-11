#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Запуск VHM24...\n');

// Сервисы для запуска
const services = [
  { name: 'Gateway', path: 'services/gateway', port: 8000 },
  { name: 'Auth', path: 'services/auth', port: 3001 },
  { name: 'Machines', path: 'services/machines', port: 3002 },
  { name: 'Inventory', path: 'services/inventory', port: 3003 },
  { name: 'Tasks', path: 'services/tasks', port: 3004 },
  { name: 'Routes', path: 'services/routes', port: 3005 },
  { name: 'Warehouse', path: 'services/warehouse', port: 3006 },
  { name: 'Recipes', path: 'services/recipes', port: 3007 },
  { name: 'Notifications', path: 'services/notifications', port: 3008 },
  { name: 'Audit', path: 'services/audit', port: 3009 },
  { name: 'Monitoring', path: 'services/monitoring', port: 3010 },
  { name: 'Backup', path: 'services/backup', port: 3011 },
  { name: 'Data Import', path: 'services/data-import', port: 3012 }
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

    proc.stdout.on('data', data => {
      console.log(`[${service.name}] ${data.toString().trim()}`);
    });

    proc.stderr.on('data', data => {
      const msg = data.toString().trim();
      if (msg && !msg.includes('ExperimentalWarning')) {
        console.error(`[${service.name}] ⚠️  ${msg}`);
      }
    });

    processes.push(proc);
  }, index * 1000); // Задержка между запусками
});

// Запуск Web Dashboard через 15 секунд
setTimeout(() => {
  console.log('\n🌐 Запуск Web Dashboard...');

  const dashboard = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, 'apps/web-dashboard'),
    shell: true
  });

  dashboard.stdout.on('data', data => {
    console.log(`[Dashboard] ${data.toString().trim()}`);
  });

  dashboard.stderr.on('data', data => {
    const msg = data.toString().trim();
    if (msg && !msg.includes('ExperimentalWarning')) {
      console.error(`[Dashboard] ⚠️  ${msg}`);
    }
  });

  processes.push(dashboard);
}, 15000);

// Информация
setTimeout(() => {
  console.log('\n✅ Все сервисы запущены!');
  console.log('\n📍 Доступные URL:');
  console.log('   Gateway API: http://localhost:8000');
  console.log('   Web Dashboard: http://localhost:3000');
  console.log('   Auth Service: http://localhost:3001');
  console.log('   Recipes Service: http://localhost:3007');
  console.log('\n📝 Нажмите Ctrl+C для остановки всех сервисов');
}, 20000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Остановка всех сервисов...');
  processes.forEach(proc => {
    if (proc && !proc.killed) {
      proc.kill('SIGINT');
    }
  });
  setTimeout(() => {
    process.exit(0);
  }, 2000);
});
