const logger = require('@vhm24/shared/logger');

#!/usr/bin/env node

/**
 * VHM24 Simple Dependencies Installation
 * Простая установка зависимостей для VHM24
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

logger.info('🔧 Установка зависимостей VHM24...\n');

// Функция для выполнения команды с выводом
function runCommand(command, cwd = process.cwd()) {
  try {
    logger.info(`📦 Выполняется: ${command} в ${cwd}`);
    const result = execSync(command, { 
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

// Проверяем наличие Node.js и npm
function checkPrerequisites() {
  logger.info('🔍 Проверка предварительных требований...');
  
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    
    logger.info(`✅ Node.js: ${nodeVersion}`);
    logger.info(`✅ npm: ${npmVersion}\n`);
    return true;
  } catch (error) {
    logger.info('❌ Node.js или npm не установлены');
    return false;
  }
}

// Основные пакеты для установки
const packages = [
  'packages/database',
  'packages/shared',
  'packages/shared-types',
  'services/notifications',
  'services/audit',
  'services/gateway'
];

async function main() {
  // Проверяем предварительные требования
  if (!checkPrerequisites()) {
    process.exit(1);
  }

  // Устанавливаем зависимости в корне
  logger.info('📦 Установка корневых зависимостей...');
  if (!runCommand('npm install')) {
    logger.info('⚠️  Ошибка установки корневых зависимостей, продолжаем...\n');
  }

  // Устанавливаем зависимости для каждого пакета
  for (const pkg of packages) {
    const pkgPath = path.join(__dirname, pkg);
    const packageJsonPath = path.join(pkgPath, 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      logger.info(`📦 Установка зависимостей для ${pkg}...`);
      if (!runCommand('npm install', pkgPath)) {
        logger.info(`⚠️  Ошибка установки зависимостей для ${pkg}, продолжаем...\n`);
      }
    } else {
      logger.info(`⚠️  package.json не найден для ${pkg}\n`);
    }
  }

  logger.info('🎉 Установка зависимостей завершена!');
  logger.info('\n🚀 Теперь можно запускать:');
  logger.info('   node start-all-services-with-audit.js');
  logger.info('   node test-complete-system-with-notifications.js');
}

main().catch(error => {
  logger.error('💥 Критическая ошибка:', error);
  process.exit(1);
});
