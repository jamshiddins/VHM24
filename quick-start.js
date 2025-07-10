const logger = require('@vhm24/shared/logger');

#!/usr/bin/env node

/**
 * VHM24 Quick Start
 * Быстрый запуск системы VHM24
 */

const { spawn } = require('child_process');
const path = require('path');

logger.info('🚀 Быстрый запуск VHM24...\n');

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
    logger.info(`${service.color}🔧 Запуск ${service.name}...\x1b[0m`);
    
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
      logger.info(`${service.color}[${service.name}]\x1b[0m ${output.trim()}`);
      
      if (!started && (output.includes('listening') || output.includes('running') || output.includes('started'))) {
        started = true;
        logger.info(`${service.color}✅ ${service.name} запущен на порту ${service.port}\x1b[0m`);
        resolve(childProcess);
      }
    });

    childProcess.stderr.on('data', (data) => {
      const output = data.toString();
      if (!output.includes('ExperimentalWarning')) {
        logger.info(`${service.color}[${service.name} ERROR]\x1b[0m ${output.trim()}`);
      }
    });

    childProcess.on('close', (code) => {
      logger.info(`${service.color}❌ ${service.name} завершен с кодом ${code}\x1b[0m`);
    });

    childProcess.on('error', (error) => {
      logger.info(`${service.color}💥 Ошибка запуска ${service.name}: ${error.message}\x1b[0m`);
      if (!started) {
        resolve(null);
      }
    });

    processes.push(childProcess);

    // Таймаут для запуска
    setTimeout(() => {
      if (!started) {
        logger.info(`${service.color}⚠️  ${service.name} запускается медленно...\x1b[0m`);
        resolve(childProcess);
      }
    }, 5000);
  });
}

// Основная функция
async function main() {
  try {
  logger.info('🔧 Запуск основных сервисов VHM24...\n');

  // Запускаем сервисы последовательно
  for (const service of services) {
    await startService(service);
    // Небольшая пауза между запусками
    await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
    logger.error('Error:', error);
    throw error;
  }
}

  logger.info('\n🎉 Все сервисы запущены!');
  logger.info('\n📋 Доступные endpoints:');
  logger.info('   🌐 API Gateway: http://localhost:8000');
  logger.info('   🔐 Auth Service: http://localhost:3001');
  logger.info('   🤖 Machines Service: http://localhost:3002');
  logger.info('   🔔 Notifications Service: http://localhost:3006');
  logger.info('   🔍 Audit Service: http://localhost:3007');
  
  logger.info('\n🧪 Для тестирования запустите:');
  logger.info('   node test-complete-system-with-notifications.js');
  
  logger.info('\n📊 Для веб-интерфейса запустите:');
  logger.info('   npm run dashboard');
  
  logger.info('\n⚠️  Для остановки нажмите Ctrl+C');
}

// Обработка сигналов завершения
process.on('SIGINT', () => {
  logger.info('\n🛑 Остановка всех сервисов...');
  
  processes.forEach((proc, index) => {
    if (proc && !proc.killed) {
      logger.info(`🔴 Остановка ${services[index]?.name || 'сервиса'}...`);
      proc.kill('SIGTERM');
    }
  });
  
  setTimeout(() => {
    logger.info('👋 Все сервисы остановлены');
    process.exit(0);
  }, 2000);
});

process.on('SIGTERM', () => {
  logger.info('\n🛑 Получен сигнал завершения...');
  process.exit(0);
});

// Запуск
main().catch(error => {
  logger.error('💥 Критическая ошибка:', error);
  process.exit(1);
});
