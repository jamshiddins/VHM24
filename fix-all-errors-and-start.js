const logger = require('@vhm24/shared/logger');

#!/usr/bin/env node

/**
 * VHM24 Complete Error Fix and Start
 * Комплексное исправление всех ошибок и запуск системы
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

logger.info('🔧 Комплексное исправление ошибок VHM24...\n');

// Функция для выполнения команды с выводом
function runCommand(command, cwd = process.cwd()) {
  try {
    logger.info(`📦 Выполняется: ${command}`);
    execSync(command, { 
      cwd, 
      stdio: 'inherit',
      encoding: 'utf8'
    });
    logger.info(`✅ Команда выполнена успешно\n`);
    return true;
  } catch (error) {
    logger.info(`❌ Ошибка выполнения команды: ${error.message}\n`);
    return false;
  }
}

// Функция для создания недостающих директорий
function createMissingDirectories() {
  logger.info('📁 Создание недостающих директорий...');
  
  const directories = [
    'services/data-import/templates',
    'services/notifications/logs',
    'services/audit/logs',
    'services/gateway/uploads',
    'services/backup/backups'
  ];

  directories.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      logger.info(`✅ Создана директория: ${dir}`);
    }
  });
}

// Функция для остановки всех процессов Node.js
function killAllNodeProcesses() {
  logger.info('🛑 Остановка всех процессов Node.js...');
  try {
    if (process.platform === 'win32') {
      execSync('taskkill /f /im node.exe', { stdio: 'ignore' });
    } else {
      execSync('pkill -f node', { stdio: 'ignore' });
    }
    logger.info('✅ Все процессы остановлены');
  } catch (error) {
    logger.info('⚠️  Некоторые процессы не удалось остановить (это нормально)');
  }
}

// Функция для установки зависимостей
function installDependencies() {
  logger.info('📦 Установка зависимостей...');
  
  const packages = [
    '.',
    'packages/database',
    'packages/shared',
    'packages/shared-types',
    'services/gateway',
    'services/auth',
    'services/machines',
    'services/notifications',
    'services/audit',
    'services/routes',
    'services/warehouse',
    'services/recipes'
  ];

  for (const pkg of packages) {
    const pkgPath = path.join(__dirname, pkg);
    const packageJsonPath = path.join(pkgPath, 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      logger.info(`📦 Установка зависимостей для ${pkg}...`);
      if (!runCommand('npm install --no-audit --no-fund', pkgPath)) {
        logger.info(`⚠️  Ошибка установки зависимостей для ${pkg}, продолжаем...\n`);
      }
    }
  }
}

// Функция для запуска сервиса
function startService(service) {
  return new Promise((resolve) => {
    logger.info(`🔧 Запуск ${service.name}...`);
    
    const childProcess = spawn('npm', ['start'], {
      cwd: path.join(__dirname, service.path),
      stdio: 'pipe',
      env: {
        ...process.env,
        PORT: service.port
      }
    });

    let started = false;
    let output = '';

    childProcess.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      logger.info(`[${service.name}] ${text.trim()}`);
      
      if (!started && (text.includes('listening') || text.includes('running') || text.includes('Server listening'))) {
        started = true;
        logger.info(`✅ ${service.name} запущен на порту ${service.port}`);
        resolve({ process: childProcess, success: true });
      }
    });

    childProcess.stderr.on('data', (data) => {
      const text = data.toString();
      if (!text.includes('ExperimentalWarning') && !text.includes('DeprecationWarning')) {
        logger.info(`[${service.name} ERROR] ${text.trim()}`);
      }
    });

    childProcess.on('close', (code) => {
      if (!started) {
        logger.info(`❌ ${service.name} завершен с кодом ${code}`);
        resolve({ process: null, success: false });
      }
    });

    childProcess.on('error', (error) => {
      logger.info(`💥 Ошибка запуска ${service.name}: ${error.message}`);
      if (!started) {
        resolve({ process: null, success: false });
      }
    });

    // Таймаут для запуска
    setTimeout(() => {
      if (!started) {
        logger.info(`⚠️  ${service.name} запускается медленно...`);
        resolve({ process: childProcess, success: true });
      }
    }, 10000);
  });
}

// Основная функция
async function main() {
  try {
    // 1. Остановка всех процессов
    killAllNodeProcesses();
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Создание недостающих директорий
    createMissingDirectories();

    // 3. Установка зависимостей
    installDependencies();

    // 4. Запуск сервисов
    logger.info('\n🚀 Запуск сервисов...\n');
    
    const services = [
      { name: 'Auth', path: 'services/auth', port: 3001 },
      { name: 'Gateway', path: 'services/gateway', port: 8000 },
      { name: 'Machines', path: 'services/machines', port: 3002 },
      { name: 'Notifications', path: 'services/notifications', port: 3006 },
      { name: 'Audit', path: 'services/audit', port: 3007 }
    ];

    const runningProcesses = [];
    let successCount = 0;

    for (const service of services) {
      const result = await startService(service);
      if (result.success) {
        successCount++;
        if (result.process) {
          runningProcesses.push(result.process);
        }
      }
      // Пауза между запусками
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    logger.info('\n🎉 Запуск завершен!');
    logger.info(`📊 Запущено сервисов: ${successCount}/${services.length}`);
    
    if (successCount > 0) {
      logger.info('\n📋 Доступные endpoints:');
      logger.info('   🌐 API Gateway: http://localhost:8000');
      logger.info('   🔐 Auth Service: http://localhost:3001');
      logger.info('   🤖 Machines Service: http://localhost:3002');
      logger.info('   🔔 Notifications Service: http://localhost:3006');
      logger.info('   🔍 Audit Service: http://localhost:3007');
      
      logger.info('\n🧪 Для тестирования запустите:');
      logger.info('   node test-complete-system-with-notifications.js');
      
      logger.info('\n⚠️  Для остановки нажмите Ctrl+C');

      // Обработка сигналов завершения
      process.on('SIGINT', () => {
        logger.info('\n🛑 Остановка всех сервисов...');
        runningProcesses.forEach(proc => {
          if (proc && !proc.killed) {
            proc.kill('SIGTERM');
          }
        });
        setTimeout(() => {
          logger.info('👋 Все сервисы остановлены');
          process.exit(0);
        }, 2000);
      });

      // Ожидание завершения
      await new Promise(() => {});
    } else {
      logger.info('❌ Не удалось запустить ни одного сервиса');
      process.exit(1);
    }

  } catch (error) {
    logger.error('💥 Критическая ошибка:', error);
    process.exit(1);
  }
}

// Запуск
main();
