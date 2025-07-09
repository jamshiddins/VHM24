#!/usr/bin/env node

/**
 * VHM24 Quick Start
 * Быстрый запуск системы VHM24
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Быстрый запуск VHM24...\n');

// Сервисы для запуска
const services = [
  {
    name: 'Gateway',
    script: 'services/gateway/src/index.js',
    port: 8000,
    color: '\x1b[36m' // cyan
  },
  {
    name: 'Auth',
    script: 'services/auth/src/index.js',
    port: 3001,
    color: '\x1b[32m' // green
  },
  {
    name: 'Machines',
    script: 'services/machines/src/index.js',
    port: 3002,
    color: '\x1b[33m' // yellow
  },
  {
    name: 'Notifications',
    script: 'services/notifications/src/index.js',
    port: 3006,
    color: '\x1b[35m' // magenta
  },
  {
    name: 'Audit',
    script: 'services/audit/src/index.js',
    port: 3007,
    color: '\x1b[34m' // blue
  }
];

const processes = [];

// Функция для запуска сервиса
function startService(service) {
  return new Promise((resolve) => {
    console.log(`${service.color}🔧 Запуск ${service.name}...\x1b[0m`);
    
    const childProcess = spawn('node', [service.script], {
      cwd: __dirname,
      stdio: 'pipe',
      env: {
        ...process.env,
        PORT: service.port
      }
    });

    let started = false;

    childProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`${service.color}[${service.name}]\x1b[0m ${output.trim()}`);
      
      if (!started && (output.includes('listening') || output.includes('running') || output.includes('started'))) {
        started = true;
        console.log(`${service.color}✅ ${service.name} запущен на порту ${service.port}\x1b[0m`);
        resolve(childProcess);
      }
    });

    childProcess.stderr.on('data', (data) => {
      const output = data.toString();
      if (!output.includes('ExperimentalWarning')) {
        console.log(`${service.color}[${service.name} ERROR]\x1b[0m ${output.trim()}`);
      }
    });

    childProcess.on('close', (code) => {
      console.log(`${service.color}❌ ${service.name} завершен с кодом ${code}\x1b[0m`);
    });

    childProcess.on('error', (error) => {
      console.log(`${service.color}💥 Ошибка запуска ${service.name}: ${error.message}\x1b[0m`);
      if (!started) {
        resolve(null);
      }
    });

    processes.push(childProcess);

    // Таймаут для запуска
    setTimeout(() => {
      if (!started) {
        console.log(`${service.color}⚠️  ${service.name} запускается медленно...\x1b[0m`);
        resolve(childProcess);
      }
    }, 5000);
  });
}

// Основная функция
async function main() {
  console.log('🔧 Запуск основных сервисов VHM24...\n');

  // Запускаем сервисы последовательно
  for (const service of services) {
    await startService(service);
    // Небольшая пауза между запусками
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n🎉 Все сервисы запущены!');
  console.log('\n📋 Доступные endpoints:');
  console.log('   🌐 API Gateway: http://localhost:8000');
  console.log('   🔐 Auth Service: http://localhost:3001');
  console.log('   🤖 Machines Service: http://localhost:3002');
  console.log('   🔔 Notifications Service: http://localhost:3006');
  console.log('   🔍 Audit Service: http://localhost:3007');
  
  console.log('\n🧪 Для тестирования запустите:');
  console.log('   node test-complete-system-with-notifications.js');
  
  console.log('\n📊 Для веб-интерфейса запустите:');
  console.log('   npm run dashboard');
  
  console.log('\n⚠️  Для остановки нажмите Ctrl+C');
}

// Обработка сигналов завершения
process.on('SIGINT', () => {
  console.log('\n🛑 Остановка всех сервисов...');
  
  processes.forEach((proc, index) => {
    if (proc && !proc.killed) {
      console.log(`🔴 Остановка ${services[index]?.name || 'сервиса'}...`);
      proc.kill('SIGTERM');
    }
  });
  
  setTimeout(() => {
    console.log('👋 Все сервисы остановлены');
    process.exit(0);
  }, 2000);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Получен сигнал завершения...');
  process.exit(0);
});

// Запуск
main().catch(error => {
  console.error('💥 Критическая ошибка:', error);
  process.exit(1);
});
