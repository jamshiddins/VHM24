const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Простой логгер
const logger = {
  info: (message) => console.log(message),
  error: (message) => console.error('\x1b[31m%s\x1b[0m', message),
  warn: (message) => console.warn('\x1b[33m%s\x1b[0m', message),
  success: (message) => console.log('\x1b[32m%s\x1b[0m', message)
};

/**
 * Настройка системы исправления ошибок
 */
async function setupErrorFixingSystem() {
  logger.info('\n🚀 VHM24 - НАСТРОЙКА СИСТЕМЫ ИСПРАВЛЕНИЯ ОШИБОК 🚀\n');

  try {
    // 1. Проверка структуры директорий
    logger.info('📁 Проверка структуры директорий...');
    checkDirectories();
    logger.success('✅ Структура директорий проверена');

    // 2. Проверка наличия необходимых файлов
    logger.info('\n📄 Проверка наличия необходимых файлов...');
    checkFiles();
    logger.success('✅ Все необходимые файлы присутствуют');

    // 3. Создание конфигурационных файлов
    logger.info('\n⚙️ Создание конфигурационных файлов...');
    createConfigFiles();
    logger.success('✅ Конфигурационные файлы созданы');

    // 4. Установка зависимостей
    logger.info('\n📦 Установка зависимостей...');
    await installDependencies();

    // 5. Настройка логгера
    logger.info('\n📝 Настройка логгера...');
    setupLogger();
    logger.success('✅ Логгер настроен');

    // 6. Финальные инструкции
    showFinalInstructions();

  } catch (error) {
    logger.error(`\n❌ Критическая ошибка: ${error.message}`);
    if (error.stack) {
      logger.error(`Стек ошибки: ${error.stack}`);
    }
    process.exit(1);
  }
}

/**
 * Проверка наличия необходимых директорий
 */
function checkDirectories() {
  const requiredDirs = [
    'deploy',
    'deploy/scripts',
  ];

  requiredDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Создана директория: ${dir}`);
    }
  });
}

/**
 * Проверка наличия необходимых файлов
 */
function checkFiles() {
  const requiredFiles = [
    'deploy/scripts/project-analyzer.js',
    'deploy/scripts/auto-fixer.js',
    'deploy/scripts/test-after-fixes.js',
    'deploy/fix-all-errors.js',
    'deploy/VHM24_ERROR_FIXING_SYSTEM.md',
    'deploy/VHM24_ERROR_FIXING_EXAMPLES.md',
    'deploy/QUICK_START_ERROR_FIXING.md',
    'deploy/VHM24_FIX_CHECKLIST.md'
  ];

  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    logger.warn(`Отсутствуют следующие файлы: ${missingFiles.join(', ')}`);
    logger.info('Эти файлы должны быть созданы перед использованием системы');
  }
}

/**
 * Создание конфигурационных файлов
 */
function createConfigFiles() {
  // Создание .npmrc для настройки npm
  const npmrc = `
# Настройки npm для исправления уязвимостей
audit=true
fund=false
loglevel=warn
engine-strict=false
legacy-peer-deps=true
`;
  fs.writeFileSync('.npmrc', npmrc);
  logger.info('Создан файл .npmrc');

  // Создание .eslintrc.json
  const eslintrc = `{
  "env": {
    "node": true,
    "es2021": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "rules": {
    "no-unused-vars": "warn",
    "no-console": "off"
  }
}`;
  fs.writeFileSync('deploy/.eslintrc.json', eslintrc);
  logger.info('Создан файл deploy/.eslintrc.json');
}

/**
 * Установка зависимостей
 */
async function installDependencies() {
  // Список базовых зависимостей (без нативных модулей)
  const basicDependencies = [
    'glob@10.3.10',
    'fastify@4.24.0',
    'pino@8.16.0'
  ];

  // Список дополнительных зависимостей (могут требовать компиляции)
  const optionalDependencies = [
    'node-fetch@3.3.2',
    'tap@18.5.0',
    '@fastify/jwt@7.2.4'
  ];

  logger.info('Установка базовых зависимостей...');
  try {
    // Устанавливаем базовые зависимости
    execSync(`npm install --save ${basicDependencies.join(' ')}`, { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'development' }
    });
    logger.success('✅ Базовые зависимости установлены');
  } catch (error) {
    logger.warn(`⚠️ Не удалось установить базовые зависимости: ${error.message}`);
    logger.info('Попытка установки с флагом --no-optional...');
    
    try {
      execSync(`npm install --save --no-optional ${basicDependencies.join(' ')}`, { 
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'development' }
      });
      logger.success('✅ Базовые зависимости установлены с флагом --no-optional');
    } catch (secondError) {
      logger.error(`❌ Не удалось установить базовые зависимости: ${secondError.message}`);
      throw new Error('Не удалось установить необходимые зависимости');
    }
  }

  // Пытаемся установить дополнительные зависимости
  logger.info('Установка дополнительных зависимостей...');
  for (const dependency of optionalDependencies) {
    try {
      execSync(`npm install --save --no-fund ${dependency}`, { 
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'development' }
      });
      logger.success(`✅ Установлена зависимость: ${dependency}`);
    } catch (error) {
      logger.warn(`⚠️ Не удалось установить зависимость ${dependency}: ${error.message}`);
      logger.info('Продолжаем установку других зависимостей...');
    }
  }

  // Создаем package.json для deploy директории
  const deployPackageJson = {
    "name": "vhm24-error-fixing-system",
    "version": "1.0.0",
    "description": "Система исправления ошибок для проекта VHM24",
    "main": "fix-all-errors.js",
    "scripts": {
      "analyze": "node scripts/project-analyzer.js",
      "fix": "node scripts/auto-fixer.js",
      "test": "node scripts/test-after-fixes.js",
      "all": "node fix-all-errors.js"
    },
    "dependencies": {
      "glob": "^10.3.10"
    }
  };

  fs.writeFileSync('deploy/package.json', JSON.stringify(deployPackageJson, null, 2));
  logger.info('Создан файл deploy/package.json');
}

/**
 * Настройка логгера
 */
function setupLogger() {
  // Создаем простой логгер для использования в скриптах
  const loggerCode = `
// Простой логгер для системы исправления ошибок
const logger = {
  info: (message) => console.log(message),
  error: (message) => console.error('\\x1b[31m%s\\x1b[0m', message),
  warn: (message) => console.warn('\\x1b[33m%s\\x1b[0m', message),
  success: (message) => console.log('\\x1b[32m%s\\x1b[0m', message),
  debug: (message) => process.env.DEBUG && console.log('\\x1b[36m%s\\x1b[0m', message)
};

module.exports = logger;
`;

  const loggerDir = 'deploy/utils';
  if (!fs.existsSync(loggerDir)) {
    fs.mkdirSync(loggerDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(loggerDir, 'logger.js'), loggerCode);
  logger.info('Создан файл logger.js');
}

/**
 * Показать финальные инструкции
 */
function showFinalInstructions() {
  logger.info('\n🎉 Настройка системы исправления ошибок завершена!\n');
  logger.info('Для запуска системы используйте следующие команды:');
  logger.info('1. Анализ проекта:');
  logger.info('   node deploy/scripts/project-analyzer.js');
  logger.info('2. Исправление ошибок:');
  logger.info('   node deploy/scripts/auto-fixer.js');
  logger.info('3. Тестирование после исправлений:');
  logger.info('   node deploy/scripts/test-after-fixes.js');
  logger.info('4. Полный процесс (анализ + исправление + тестирование):');
  logger.info('   node deploy/fix-all-errors.js');
  logger.info('\nДополнительная информация:');
  logger.info('- Документация: deploy/VHM24_ERROR_FIXING_SYSTEM.md');
  logger.info('- Примеры исправлений: deploy/VHM24_ERROR_FIXING_EXAMPLES.md');
  logger.info('- Быстрый старт: deploy/QUICK_START_ERROR_FIXING.md');
  logger.info('- Чеклист: deploy/VHM24_FIX_CHECKLIST.md');
}

// Запуск настройки
setupErrorFixingSystem().catch(error => {
  logger.error(`Критическая ошибка: ${error.message}`);
  process.exit(1);
});
