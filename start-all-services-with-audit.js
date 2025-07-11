#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Запуск всех сервисов VHM24 с системой аудита...\n');

// Список всех сервисов с их портами и путями
const services = [
  {
    name: 'Gateway',
    path: 'services/gateway',
    port: process.env.GATEWAY_PORT || 8000,
    env: { PORT: process.env.GATEWAY_PORT || 8000 },
    icon: '🌐'
  },
  {
    name: 'Auth',
    path: 'services/auth',
    port: process.env.AUTH_PORT || 3001,
    env: { PORT: process.env.AUTH_PORT || 3001 },
    icon: '🔐'
  },
  {
    name: 'Machines',
    path: 'services/machines',
    port: process.env.MACHINES_PORT || 3002,
    env: { PORT: process.env.MACHINES_PORT || 3002 },
    icon: '🤖'
  },
  {
    name: 'Inventory',
    path: 'services/inventory',
    port: process.env.INVENTORY_PORT || 3003,
    env: { PORT: process.env.INVENTORY_PORT || 3003 },
    icon: '📦'
  },
  {
    name: 'Tasks',
    path: 'services/tasks',
    port: process.env.TASKS_PORT || 3004,
    env: { PORT: process.env.TASKS_PORT || 3004 },
    icon: '✅'
  },
  {
    name: 'Routes',
    path: 'services/routes',
    port: process.env.ROUTES_PORT || 3005,
    env: { PORT: process.env.ROUTES_PORT || 3005 },
    icon: '🛣️'
  },
  {
    name: 'Warehouse',
    path: 'services/warehouse',
    port: process.env.WAREHOUSE_PORT || 3006,
    env: { PORT: process.env.WAREHOUSE_PORT || 3006 },
    icon: '🏭'
  },
  {
    name: 'Recipes',
    path: 'services/recipes',
    port: process.env.RECIPES_PORT || 3007,
    env: { PORT: process.env.RECIPES_PORT || 3007 },
    icon: '📋'
  },
  {
    name: 'Notifications',
    path: 'services/notifications',
    port: process.env.NOTIFICATIONS_PORT || 3008,
    env: { PORT: process.env.NOTIFICATIONS_PORT || 3008 },
    icon: '🔔'
  },
  {
    name: 'Audit',
    path: 'services/audit',
    port: process.env.AUDIT_SERVICE_PORT || 3009,
    env: {
      PORT: process.env.AUDIT_SERVICE_PORT || 3009,
      AUDIT_SERVICE_PORT: process.env.AUDIT_SERVICE_PORT || 3009
    },
    icon: '🔍'
  },
  {
    name: 'Monitoring',
    path: 'services/monitoring',
    port: process.env.MONITORING_PORT || 3010,
    env: { PORT: process.env.MONITORING_PORT || 3010 },
    icon: '📊'
  },
  {
    name: 'Backup',
    path: 'services/backup',
    port: process.env.BACKUP_PORT || 3011,
    env: { PORT: process.env.BACKUP_PORT || 3011 },
    icon: '💾'
  },
  {
    name: 'Data Import',
    path: 'services/data-import',
    port: process.env.DATA_IMPORT_PORT || 3012,
    env: { PORT: process.env.DATA_IMPORT_PORT || 3012 },
    icon: '📥'
  }
];

const runningProcesses = [];

// Функция для установки зависимостей сервиса
async function installDependencies(service) {
  return new Promise((resolve, reject) => {
    const servicePath = path.join(__dirname, service.path);

    if (!fs.existsSync(servicePath)) {
      console.log(
        `⚠️  Сервис ${service.name} не найден по пути ${servicePath}`
      );
      resolve();
      return;
    }

    console.log(`📦 Установка зависимостей для ${service.name}...`);

    const installProcess = spawn('npm', ['install'], {
      cwd: servicePath,
      stdio: 'pipe',
      shell: true
    });

    let output = '';
    installProcess.stdout.on('data', data => {
      output += data.toString();
    });

    installProcess.stderr.on('data', data => {
      output += data.toString();
    });

    installProcess.on('close', code => {
      if (code === 0) {
        console.log(`✅ Зависимости для ${service.name} установлены`);
        resolve();
      } else {
        console.log(
          `❌ Ошибка установки зависимостей для ${service.name}:`,
          output
        );
        resolve(); // Продолжаем даже при ошибке
      }
    });

    installProcess.on('error', error => {
      console.log(
        `❌ Ошибка запуска установки для ${service.name}:`,
        error.message
      );
      resolve();
    });
  });
}

// Функция для запуска сервиса
function startService(service) {
  return new Promise(resolve => {
    const servicePath = path.join(__dirname, service.path);

    if (!fs.existsSync(servicePath)) {
      console.log(`⚠️  Пропуск ${service.name} - сервис не найден`);
      resolve();
      return;
    }

    console.log(
      `${service.icon} Запуск ${service.name} на порту ${service.port}...`
    );

    const serviceProcess = spawn('npm', ['start'], {
      cwd: servicePath,
      stdio: 'pipe',
      shell: true,
      env: {
        ...process.env,
        ...service.env,
        NODE_ENV: process.env.NODE_ENV || 'development'
      }
    });

    // Логирование вывода сервиса
    serviceProcess.stdout.on('data', data => {
      const output = data.toString().trim();
      if (output) {
        console.log(`[${service.name}] ${output}`);
      }
    });

    serviceProcess.stderr.on('data', data => {
      const output = data.toString().trim();
      if (output && !output.includes('ExperimentalWarning')) {
        console.log(`[${service.name}] ⚠️  ${output}`);
      }
    });

    serviceProcess.on('close', code => {
      console.log(`[${service.name}] 🛑 Сервис завершен с кодом ${code}`);
      // Удаляем из списка запущенных процессов
      const index = runningProcesses.indexOf(serviceProcess);
      if (index > -1) {
        runningProcesses.splice(index, 1);
      }
    });

    serviceProcess.on('error', error => {
      console.log(`[${service.name}] ❌ Ошибка запуска: ${error.message}`);
    });

    // Добавляем в список запущенных процессов
    runningProcesses.push(serviceProcess);

    // Даем время на запуск
    setTimeout(() => {
      resolve();
    }, 2000);
  });
}

// Функция для проверки доступности порта
function checkPort(port) {
  return new Promise(resolve => {
    const net = require('net');
    const server = net.createServer();

    server.listen(port, () => {
      server.once('close', () => {
        resolve(true); // Порт свободен
      });
      server.close();
    });

    server.on('error', () => {
      resolve(false); // Порт занят
    });
  });
}

// Функция для отображения статуса сервисов
async function showStatus() {
  console.log('\n📊 Статус сервисов:');
  console.log('━'.repeat(50));

  for (const service of services) {
    const isPortFree = await checkPort(service.port);
    const status = isPortFree ? '❌ Остановлен' : '✅ Запущен';
    console.log(
      `${service.icon} ${service.name.padEnd(15)} ${service.port.toString().padEnd(6)} ${status}`
    );
  }

  console.log('━'.repeat(50));
  console.log(
    `📈 Запущено сервисов: ${runningProcesses.length}/${services.length}`
  );
}

// Основная функция запуска
async function startAllServices() {
  console.log('🔧 Установка зависимостей для всех сервисов...\n');

  // Устанавливаем зависимости параллельно
  const installPromises = services.map(service => installDependencies(service));
  await Promise.all(installPromises);

  console.log('\n🚀 Запуск всех сервисов...\n');

  // Запускаем сервисы последовательно с задержкой
  for (const service of services) {
    await startService(service);
  }

  console.log('\n🎉 Все доступные сервисы запущены!\n');

  // Показываем статус
  await showStatus();

  console.log('\n🌐 Основные URL:');
  console.log(`   Gateway:    http://localhost:${services[0].port}`);
  console.log(`   Dashboard:  http://localhost:3000 (запустите отдельно)`);
  console.log(
    `   Audit:      http://localhost:${services.find(s => s.name === 'Audit').port}`
  );
  console.log(`   WebSocket:  ws://localhost:${services[0].port}/ws`);

  console.log('\n📝 Команды:');
  console.log('   Ctrl+C     - Остановить все сервисы');
  console.log('   npm run dashboard - Запустить веб-дашборд');
  console.log('   npm run test-audit - Тестировать систему аудита');

  // Периодически показываем статус
  setInterval(async () => {
    await showStatus();
  }, 30000); // Каждые 30 секунд
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Остановка всех сервисов...');

  runningProcesses.forEach((proc, index) => {
    if (proc && !proc.killed) {
      console.log(`🛑 Остановка сервиса ${services[index]?.name || index}...`);
      proc.kill('SIGINT');
    }
  });

  setTimeout(() => {
    console.log('👋 Все сервисы остановлены');
    process.exit(0);
  }, 3000);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Получен сигнал SIGTERM, остановка сервисов...');
  runningProcesses.forEach(proc => {
    if (proc && !proc.killed) {
      proc.kill('SIGTERM');
    }
  });
  process.exit(0);
});

// Обработка необработанных ошибок
process.on('uncaughtException', error => {
  console.error('💥 Необработанная ошибка:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Необработанное отклонение промиса:', reason);
});

// Запуск
startAllServices().catch(error => {
  console.error('💥 Критическая ошибка при запуске сервисов:', error);
  process.exit(1);
});
