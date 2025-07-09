#!/usr/bin/env node

/**
 * VHM24 Simple Dependencies Installation
 * Простая установка зависимостей для VHM24
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Установка зависимостей VHM24...\n');

// Функция для выполнения команды с выводом
function runCommand(command, cwd = process.cwd()) {
  try {
    console.log(`📦 Выполняется: ${command} в ${cwd}`);
    const result = execSync(command, { 
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

// Проверяем наличие Node.js и npm
function checkPrerequisites() {
  console.log('🔍 Проверка предварительных требований...');
  
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    
    console.log(`✅ Node.js: ${nodeVersion}`);
    console.log(`✅ npm: ${npmVersion}\n`);
    return true;
  } catch (error) {
    console.log('❌ Node.js или npm не установлены');
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
  console.log('📦 Установка корневых зависимостей...');
  if (!runCommand('npm install')) {
    console.log('⚠️  Ошибка установки корневых зависимостей, продолжаем...\n');
  }

  // Устанавливаем зависимости для каждого пакета
  for (const pkg of packages) {
    const pkgPath = path.join(__dirname, pkg);
    const packageJsonPath = path.join(pkgPath, 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      console.log(`📦 Установка зависимостей для ${pkg}...`);
      if (!runCommand('npm install', pkgPath)) {
        console.log(`⚠️  Ошибка установки зависимостей для ${pkg}, продолжаем...\n`);
      }
    } else {
      console.log(`⚠️  package.json не найден для ${pkg}\n`);
    }
  }

  console.log('🎉 Установка зависимостей завершена!');
  console.log('\n🚀 Теперь можно запускать:');
  console.log('   node start-all-services-with-audit.js');
  console.log('   node test-complete-system-with-notifications.js');
}

main().catch(error => {
  console.error('💥 Критическая ошибка:', error);
  process.exit(1);
});
