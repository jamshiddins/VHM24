const logger = require('@vhm24/shared/logger');

#!/usr/bin/env node

/**
 * VHM24 Dependencies Fix and Start Script
 * Исправление зависимостей и запуск всех сервисов
 */

const { spawn, exec } = require('child_process');
const fs = require('fs')
const { promises: fsPromises } = fs;
const path = require('path');

logger.info('🔧 Исправление зависимостей и запуск VHM24...\n');

// Список сервисов с их зависимостями
const services = [
  {
    name: 'Notifications',
    path: 'services/notifications',
    dependencies: {
      '@fastify/cors': '^11.0.1',
      '@fastify/helmet': '^13.0.1',
      '@fastify/jwt': '^9.1.0',
      '@fastify/rate-limit': '^10.3.0',
      '@vhm24/database': 'file:../../packages/database',
      '@vhm24/shared-types': 'file:../../packages/shared-types',
      'dotenv': '^16.3.1',
      'fastify': '^5.4.0',
      'nodemailer': '^6.9.7',
      'node-telegram-bot-api': '^0.64.0',
      'winston': '^3.11.0'
    }
  },
  {
    name: 'Audit',
    path: 'services/audit',
    dependencies: {
      '@fastify/cors': '^11.0.1',
      '@fastify/helmet': '^13.0.1',
      '@fastify/jwt': '^9.1.0',
      '@fastify/rate-limit': '^10.3.0',
      '@vhm24/database': 'file:../../packages/database',
      '@vhm24/shared-types': 'file:../../packages/shared-types',
      '@vhm24/shared': 'file:../../packages/shared',
      'dotenv': '^16.3.1',
      'fastify': '^5.4.0',
      'winston': '^3.11.0'
    }
  },
  {
    name: 'Gateway',
    path: 'services/gateway',
    dependencies: {
      '@fastify/cors': '^11.0.1',
      '@fastify/helmet': '^13.0.1',
      '@fastify/jwt': '^9.1.0',
      '@fastify/rate-limit': '^10.3.0',
      '@fastify/http-proxy': '^10.0.0',
      '@fastify/multipart': '^8.0.0',
      '@fastify/websocket': '^10.0.0',
      '@vhm24/database': 'file:../../packages/database',
      '@vhm24/shared-types': 'file:../../packages/shared-types',
      '@vhm24/shared': 'file:../../packages/shared',
      'dotenv': '^16.3.1',
      'fastify': '^5.4.0',
      'uuid': '^9.0.1'
    }
  }
];

// Функция для обновления package.json
function updatePackageJson(servicePath, dependencies) {
  const packageJsonPath = path.join(__dirname, servicePath, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    logger.info(`⚠️  package.json не найден: ${packageJsonPath}`);
    return false;
  }

  try {
    const packageJson = JSON.parse(fs.await fsPromises.readFile(packageJsonPath, 'utf8'));
    
    // Обновляем зависимости
    packageJson.dependencies = {
      ...packageJson.dependencies,
      ...dependencies
    };

    // Сохраняем обновленный package.json
    fs.await fsPromises.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    logger.info(`✅ Обновлен package.json для ${servicePath}`);
    return true;
  } catch (error) {
    logger.info(`❌ Ошибка обновления package.json для ${servicePath}:`, error.message);
    return false;
  }
}

// Функция для установки зависимостей
function installDependencies(servicePath) {
  return new Promise((resolve) => {
    logger.info(`📦 Установка зависимостей для ${servicePath}...`);
    
    const installProcess = spawn('npm', ['install'], {
      cwd: path.join(__dirname, servicePath),
      stdio: 'pipe',
      shell: true
    });

    let output = '';
    installProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    installProcess.stderr.on('data', (data) => {
      output += data.toString();
    });

    installProcess.on('close', (code) => {
      if (code === 0) {
        logger.info(`✅ Зависимости установлены для ${servicePath}`);
        resolve(true);
      } else {
        logger.info(`❌ Ошибка установки зависимостей для ${servicePath}`);
        logger.info(output);
        resolve(false);
      }
    });

    installProcess.on('error', (error) => {
      logger.info(`❌ Ошибка запуска установки для ${servicePath}:`, error.message);
      resolve(false);
    });
  });
}

// Функция для создания недостающих файлов
function createMissingFiles() {
  logger.info('📁 Проверка и создание недостающих файлов...');

  // Создаем директории если не существуют
  const directories = [
    'services/notifications/src',
    'services/audit/src',
    'packages/shared/middleware'
  ];

  directories.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      logger.info(`✅ Создана директория: ${dir}`);
    }
  });

  // Проверяем наличие критически важных файлов
  const criticalFiles = [
    'services/notifications/src/index.js',
    'services/notifications/src/services/notificationService.js',
    'services/audit/src/index.js',
    'packages/shared/middleware/auditMiddleware.js'
  ];

  let missingFiles = [];
  criticalFiles.forEach(file => {
    if (!fs.existsSync(path.join(__dirname, file))) {
      missingFiles.push(file);
    }
  });

  if (missingFiles.length > 0) {
    logger.info('⚠️  Отсутствуют критически важные файлы:');
    missingFiles.forEach(file => logger.info(`   - ${file}`));
    return false;
  }

  logger.info('✅ Все критически важные файлы на месте');
  return true;
}

// Функция для проверки переменных окружения
function checkEnvironmentVariables() {
  logger.info('🔍 Проверка переменных окружения...');

  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    logger.info('⚠️  Файл .env не найден, создаем из .env.example...');
    
    const examplePath = path.join(__dirname, '.env.example');
    if (fs.existsSync(examplePath)) {
      fs.copyFileSync(examplePath, envPath);
      logger.info('✅ Создан файл .env из .env.example');
    } else {
      logger.info('❌ Файл .env.example не найден');
      return false;
    }
  }

  // Проверяем критически важные переменные
  const envContent = fs.await fsPromises.readFile(envPath, 'utf8');
  const requiredVars = ['JWT_SECRET', 'DATABASE_URL'];
  
  const missingVars = requiredVars.filter(varName => 
    !envContent.includes(`${varName}=`) || envContent.includes(`${varName}=`)
  );

  if (missingVars.length > 0) {
    logger.info('⚠️  Не хватает переменных окружения:');
    missingVars.forEach(varName => logger.info(`   - ${varName}`));
    logger.info('📝 Пожалуйста, заполните файл .env');
  } else {
    logger.info('✅ Переменные окружения настроены');
  }

  return true;
}

// Основная функция
async function main() {
  try {
    // 1. Проверяем и создаем недостающие файлы
    if (!createMissingFiles()) {
      logger.info('❌ Критические файлы отсутствуют. Остановка.');
      process.exit(1);
    }

    // 2. Проверяем переменные окружения
    checkEnvironmentVariables();

    // 3. Обновляем package.json файлы
    logger.info('\n📝 Обновление package.json файлов...');
    for (const service of services) {
      updatePackageJson(service.path, service.dependencies);
    }

    // 4. Устанавливаем зависимости
    logger.info('\n📦 Установка зависимостей...');
    for (const service of services) {
      const servicePath = path.join(__dirname, service.path);
      if (fs.existsSync(servicePath)) {
        await installDependencies(service.path);
      } else {
        logger.info(`⚠️  Сервис не найден: ${service.path}`);
      }
    }

    // 5. Устанавливаем зависимости для основных пакетов
    logger.info('\n📦 Установка зависимостей для основных пакетов...');
    const packages = ['packages/database', 'packages/shared', 'packages/shared-types'];
    
    for (const pkg of packages) {
      const pkgPath = path.join(__dirname, pkg);
      if (fs.existsSync(pkgPath)) {
        await installDependencies(pkg);
      }
    }

    // 6. Устанавливаем зависимости в корне проекта
    logger.info('\n📦 Установка корневых зависимостей...');
    await installDependencies('.');

    logger.info('\n🎉 Все зависимости установлены успешно!');
    logger.info('\n🚀 Теперь можно запускать сервисы:');
    logger.info('   node start-all-services-with-audit.js');
    logger.info('   node test-complete-system-with-notifications.js');

  } catch (error) {
    logger.error('💥 Критическая ошибка:', error);
    process.exit(1);
  }
}

// Запуск
if (require.main === module) {
  main();
}

module.exports = { main };
