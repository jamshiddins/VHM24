#!/usr/bin/env node

/**
 * VHM24 Complete Error Fix and Start
 * Комплексное исправление всех ошибок и запуск системы
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Комплексное исправление ошибок VHM24...\n');

// Функция для выполнения команды с выводом
function runCommand(command, cwd = process.cwd()) {
  try {
    console.log(`📦 Выполняется: ${command}`);
    execSync(command, { 
      cwd, 
      stdio: 'inherit',
      encoding: 'utf8'
    });
    console.log(`✅ Команда выполнена успешно\n`);
    return true;
  } catch (error) {
    console.log(`❌ Ошибка выполнения команды: ${error.message}\n`);
    return false;
  }
}

// Функция для создания недостающих директорий
function createMissingDirectories() {
  console.log('📁 Создание недостающих директорий...');
  
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
      console.log(`✅ Создана директория: ${dir}`);
    }
  });
}

// Функция для остановки всех процессов Node.js
function killAllNodeProcesses() {
  console.log('🛑 Остановка всех процессов Node.js...');
  try {
    if (process.platform === 'win32') {
      execSync('taskkill /f /im node.exe', { stdio: 'ignore' });
    } else {
      execSync('pkill -f node', { stdio: 'ignore' });
    }
    console.log('✅ Все процессы остановлены');
  } catch (error) {
    console.log('⚠️  Некоторые процессы не удалось остановить (это нормально)');
  }
}

// Функция для установки зависимостей
function installDependencies() {
  console.log('📦 Установка зависимостей...');
  
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
      console.log(`📦 Установка зависимостей для ${pkg}...`);
      if (!runCommand('npm install --no-audit --no-fund', pkgPath)) {
        console.log(`⚠️  Ошибка установки зависимостей для ${pkg}, продолжаем...\n`);
      }
    }
  }
}

// Функция для запуска сервиса
function startService(service) {
  return new Promise((resolve) => {
    console.log(`🔧 Запуск ${service.name}...`);
    
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
      console.log(`[${service.name}] ${text.trim()}`);
      
      if (!started && (text.includes('listening') || text.includes('running') || text.includes('Server listening'))) {
        started = true;
        console.log(`✅ ${service.name} запущен на порту ${service.port}`);
        resolve({ process: childProcess, success: true });
      }
    });

    childProcess.stderr.on('data', (data) => {
      const text = data.toString();
      if (!text.includes('ExperimentalWarning') && !text.includes('DeprecationWarning')) {
        console.log(`[${service.name} ERROR] ${text.trim()}`);
      }
    });

    childProcess.on('close', (code) => {
      if (!started) {
        console.log(`❌ ${service.name} завершен с кодом ${code}`);
        resolve({ process: null, success: false });
      }
    });

    childProcess.on('error', (error) => {
      console.log(`💥 Ошибка запуска ${service.name}: ${error.message}`);
      if (!started) {
        resolve({ process: null, success: false });
      }
    });

    // Таймаут для запуска
    setTimeout(() => {
      if (!started) {
        console.log(`⚠️  ${service.name} запускается медленно...`);
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
    console.log('\n🚀 Запуск сервисов...\n');
    
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

    console.log('\n🎉 Запуск завершен!');
    console.log(`📊 Запущено сервисов: ${successCount}/${services.length}`);
    
    if (successCount > 0) {
      console.log('\n📋 Доступные endpoints:');
      console.log('   🌐 API Gateway: http://localhost:8000');
      console.log('   🔐 Auth Service: http://localhost:3001');
      console.log('   🤖 Machines Service: http://localhost:3002');
      console.log('   🔔 Notifications Service: http://localhost:3006');
      console.log('   🔍 Audit Service: http://localhost:3007');
      
      console.log('\n🧪 Для тестирования запустите:');
      console.log('   node test-complete-system-with-notifications.js');
      
      console.log('\n⚠️  Для остановки нажмите Ctrl+C');

      // Обработка сигналов завершения
      process.on('SIGINT', () => {
        console.log('\n🛑 Остановка всех сервисов...');
        runningProcesses.forEach(proc => {
          if (proc && !proc.killed) {
            proc.kill('SIGTERM');
          }
        });
        setTimeout(() => {
          console.log('👋 Все сервисы остановлены');
          process.exit(0);
        }, 2000);
      });

      // Ожидание завершения
      await new Promise(() => {});
    } else {
      console.log('❌ Не удалось запустить ни одного сервиса');
      process.exit(1);
    }

  } catch (error) {
    console.error('💥 Критическая ошибка:', error);
    process.exit(1);
  }
}

// Запуск
main();
