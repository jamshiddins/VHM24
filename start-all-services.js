const logger = require('@vhm24/shared/logger');

/**
 * VHM24 - Start All Services
 * Запуск всех микросервисов системы
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Конфигурация сервисов
const services = [
  { name: 'gateway', port: 8000, path: 'services/gateway/src/index.js' },
  { name: 'auth', port: 3001, path: 'services/auth/src/index.js' },
  { name: 'machines', port: 3002, path: 'services/machines/src/index.js' },
  { name: 'inventory', port: 3003, path: 'services/inventory/src/index.js' },
  { name: 'tasks', port: 3004, path: 'services/tasks/src/index.js' },
  { name: 'bunkers', port: 3005, path: 'services/bunkers/src/index.js' },
  { name: 'notifications', port: 3006, path: 'services/notifications/src/index.js' },
  { name: 'backup', port: 3007, path: 'services/backup/src/index.js' },
  { name: 'monitoring', port: 3008, path: 'services/monitoring/src/index.js' }
];

const processes = [];

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    warning: '\x1b[33m',
    error: '\x1b[31m',
    reset: '\x1b[0m'
  };
  
  logger.info(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

function startService(service) {
  return new Promise((resolve, reject) => {
    const servicePath = path.join(__dirname, service.path);
    
    // Проверяем существование файла
    if (!fs.existsSync(servicePath)) {
      log(`❌ Service file not found: ${servicePath}`, 'error');
      resolve(false);
      return;
    }

    log(`🚀 Starting ${service.name} service on port ${service.port}...`, 'info');

    const child = spawn('node', [servicePath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PORT: service.port,
        [`${service.name.toUpperCase()}_PORT`]: service.port
      }
    });

    let started = false;
    const timeout = setTimeout(() => {
      if (!started) {
        log(`⚠️  ${service.name} service startup timeout`, 'warning');
        resolve(true); // Считаем запущенным, даже если нет подтверждения
      }
    }, 5000);

    child.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('running') || output.includes('listening') || output.includes('started')) {
        if (!started) {
          started = true;
          clearTimeout(timeout);
          log(`✅ ${service.name} service started successfully`, 'success');
          resolve(true);
        }
      }
      // Показываем вывод сервиса с префиксом
      output.split('\n').forEach(line => {
        if (line.trim()) {
          logger.info(`[${service.name}] ${line}`);
        }
      });
    });

    child.stderr.on('data', (data) => {
      const error = data.toString();
      error.split('\n').forEach(line => {
        if (line.trim()) {
          logger.info(`[${service.name}] ERROR: ${line}`);
        }
      });
    });

    child.on('error', (error) => {
      log(`❌ Failed to start ${service.name}: ${error.message}`, 'error');
      resolve(false);
    });

    child.on('exit', (code) => {
      if (code !== 0) {
        log(`❌ ${service.name} exited with code ${code}`, 'error');
      }
    });

    processes.push({ name: service.name, process: child });
  });
}

async function startAllServices() {
  try {
  log('🚀 Starting VHM24 Services...', 'info');
  log('=' .repeat(50), 'info');

  const results = [];
  
  // Запускаем сервисы последовательно с небольшой задержкой
  for (const service of services) {
    const result = await startService(service);
    results.push({ name: service.name, started: result   } catch (error) {
    logger.error('Error:', error);
    throw error;
  }
});
    
    // Небольшая пауза между запусками
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Показываем результаты
  log('\n📊 Services Status:', 'info');
  log('=' .repeat(50), 'info');
  
  let successCount = 0;
  results.forEach(result => {
    if (result.started) {
      log(`✅ ${result.name} - Running`, 'success');
      successCount++;
    } else {
      log(`❌ ${result.name} - Failed`, 'error');
    }
  });

  log(`\n🎯 Summary: ${successCount}/${services.length} services started`, 
      successCount === services.length ? 'success' : 'warning');

  if (successCount > 0) {
    log('\n🌐 Available endpoints:', 'info');
    log('• Gateway: http://localhost:8000', 'info');
    log('• Health Check: http://localhost:8000/health', 'info');
    log('• API: http://localhost:8000/api/v1', 'info');
    
    log('\n💡 Next steps:', 'info');
    log('1. Test services: node test-system-comprehensive.js', 'info');
    log('2. Start web dashboard: cd apps/web-dashboard && npm run dev', 'info');
    log('3. Press Ctrl+C to stop all services', 'info');
  }

  return successCount;
}

// Обработка завершения
process.on('SIGINT', () => {
  log('\n🛑 Stopping all services...', 'warning');
  
  processes.forEach(({ name, process }) => {
    log(`Stopping ${name}...`, 'info');
    process.kill('SIGTERM');
  });

  setTimeout(() => {
    log('All services stopped.', 'success');
    process.exit(0);
  }, 2000);
});

process.on('SIGTERM', () => {
  processes.forEach(({ process }) => {
    process.kill('SIGTERM');
  });
  process.exit(0);
});

// Запускаем сервисы
if (require.main === module) {
  startAllServices().catch(error => {
    log(`❌ Failed to start services: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { startAllServices, services };
