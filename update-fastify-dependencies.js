const logger = require('@vhm24/shared/logger');

/**
 * VHM24 - Update Fastify Dependencies
 * Обновление всех Fastify зависимостей до совместимых с версией 5.x
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Список сервисов для обновления
const services = [
  'services/gateway',
  'services/auth', 
  'services/machines',
  'services/inventory',
  'services/tasks',
  'services/bunkers',
  'services/notifications',
  'services/backup',
  'services/monitoring'
];

// Зависимости для обновления
const dependencies = [
  '@fastify/helmet@^12.0.0',
  '@fastify/cors@^10.0.0', 
  '@fastify/rate-limit@^10.0.0',
  '@fastify/jwt@^9.0.0',
  '@fastify/multipart@^9.0.0',
  '@fastify/http-proxy@^11.0.0',
  '@fastify/websocket@^11.0.0',
  '@fastify/static@^8.0.0'
];

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

async function updateService(servicePath) {
  try {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(__dirname, servicePath);
    
    // Проверяем существование package.json
    const packageJsonPath = path.join(fullPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      log(`⚠️  Skipping ${servicePath  } catch (error) {
    logger.error('Error:', error);
    throw error;
  }
} - no package.json found`, 'warning');
      resolve(false);
      return;
    }

    log(`🔄 Updating dependencies for ${servicePath}...`, 'info');

    const installProcess = spawn('npm', ['install', ...dependencies], {
      cwd: fullPath,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    installProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    installProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    installProcess.on('close', (code) => {
      if (code === 0) {
        log(`✅ Successfully updated ${servicePath}`, 'success');
        resolve(true);
      } else {
        log(`❌ Failed to update ${servicePath}: ${errorOutput}`, 'error');
        resolve(false);
      }
    });

    installProcess.on('error', (error) => {
      log(`❌ Error updating ${servicePath}: ${error.message}`, 'error');
      resolve(false);
    });
  });
}

async function updateAllServices() {
  try {
  log('🚀 Starting Fastify dependencies update...', 'info');
  log('=' .repeat(60), 'info');

  const results = [];
  
  for (const service of services) {
    const result = await updateService(service);
    results.push({ service, success: result   } catch (error) {
    logger.error('Error:', error);
    throw error;
  }
});
    
    // Небольшая пауза между обновлениями
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Показываем результаты
  log('\n📊 Update Results:', 'info');
  log('=' .repeat(60), 'info');
  
  let successCount = 0;
  results.forEach(result => {
    if (result.success) {
      log(`✅ ${result.service} - Updated`, 'success');
      successCount++;
    } else {
      log(`❌ ${result.service} - Failed`, 'error');
    }
  });

  log(`\n🎯 Summary: ${successCount}/${services.length} services updated`, 
      successCount === services.length ? 'success' : 'warning');

  if (successCount > 0) {
    log('\n💡 Next steps:', 'info');
    log('1. Restart services: node start-all-services.js', 'info');
    log('2. Test system: node test-system-comprehensive.js', 'info');
    log('3. Start web dashboard: node start-dashboard.js', 'info');
  }

  return successCount;
}

// Запускаем обновление
if (require.main === module) {
  updateAllServices().catch(error => {
    log(`❌ Failed to update services: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { updateAllServices };
