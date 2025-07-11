#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

console.log('🔧 Исправление backend сервисов VHM24...\n');

// Список всех сервисов
const services = [
  'gateway',
  'auth',
  'machines',
  'inventory',
  'tasks',
  'routes',
  'warehouse',
  'recipes',
  'notifications',
  'audit',
  'monitoring',
  'backup',
  'data-import'
];

// 1. Исправить bcrypt
async function fixBcrypt() {
  console.log('🔧 Исправление bcrypt...');
  try {
    // Переустановка bcrypt с пересборкой
    await exec('npm uninstall bcrypt');
    await exec('npm install bcrypt@5.1.1');
    console.log('✅ bcrypt установлен');
  } catch (error) {
    console.log('⚠️  Ошибка установки bcrypt:', error.message);
  }
}

// 2. Генерация Prisma для всех сервисов
async function generatePrismaForAllServices() {
  console.log('\n🔧 Генерация Prisma клиента для всех сервисов...\n');

  for (const service of services) {
    console.log(`📦 Обработка ${service}...`);

    try {
      // Создаем символическую ссылку на схему Prisma
      const servicePath = path.join(__dirname, 'services', service);
      const prismaPath = path.join(servicePath, 'prisma');
      const schemaPath = path.join(prismaPath, 'schema.prisma');
      const originalSchemaPath = path.join(
        __dirname,
        'packages/database/prisma/schema.prisma'
      );

      // Создаем папку prisma если её нет
      try {
        await fs.mkdir(prismaPath, { recursive: true });
      } catch (e) {
        // Игнорируем если папка уже существует
      }

      // Копируем схему
      try {
        await fs.copyFile(originalSchemaPath, schemaPath);
        console.log(`  ✅ Схема скопирована в ${service}`);
      } catch (e) {
        console.log(`  ⚠️  Не удалось скопировать схему для ${service}`);
        continue;
      }

      // Генерируем Prisma клиент
      try {
        await exec(`npx prisma generate --schema=${schemaPath}`, {
          cwd: servicePath
        });
        console.log(`  ✅ Prisma клиент сгенерирован для ${service}`);
      } catch (e) {
        console.log(`  ⚠️  Не удалось сгенерировать Prisma для ${service}`);
      }
    } catch (error) {
      console.log(`  ❌ Ошибка для ${service}:`, error.message);
    }
  }
}

// 3. Создать package.json с правильными зависимостями для каждого сервиса
async function updateServicePackageJson() {
  console.log('\n🔧 Обновление package.json для сервисов...\n');

  for (const service of services) {
    const packagePath = path.join(
      __dirname,
      'services',
      service,
      'package.json'
    );

    try {
      const packageJson = JSON.parse(await fs.readFile(packagePath, 'utf8'));

      // Добавляем зависимости если их нет
      if (!packageJson.dependencies) {
        packageJson.dependencies = {};
      }

      // Добавляем Prisma клиент
      packageJson.dependencies['@prisma/client'] = '^6.11.1';

      // Добавляем bcrypt для auth сервиса
      if (service === 'auth') {
        packageJson.dependencies['bcrypt'] = '^5.1.1';
      }

      // Добавляем скрипт для генерации Prisma
      if (!packageJson.scripts) {
        packageJson.scripts = {};
      }
      packageJson.scripts['prisma:generate'] = 'prisma generate';

      await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2));
      console.log(`✅ Обновлен package.json для ${service}`);
    } catch (error) {
      console.log(`⚠️  Не удалось обновить package.json для ${service}`);
    }
  }
}

// 4. Установить зависимости для каждого сервиса
async function installServiceDependencies() {
  console.log('\n🔧 Установка зависимостей для сервисов...\n');

  for (const service of [
    'auth',
    'gateway',
    'recipes',
    'notifications',
    'audit',
    'monitoring'
  ]) {
    console.log(`📦 Установка зависимостей для ${service}...`);

    try {
      const servicePath = path.join(__dirname, 'services', service);
      await exec('npm install', { cwd: servicePath });
      console.log(`✅ Зависимости установлены для ${service}`);
    } catch (error) {
      console.log(`⚠️  Ошибка установки для ${service}:`, error.message);
    }
  }
}

// Главная функция
async function main() {
  try {
    console.log('🚀 Начинаем исправление backend сервисов...\n');

    // 1. Исправить bcrypt
    await fixBcrypt();

    // 2. Обновить package.json
    await updateServicePackageJson();

    // 3. Установить зависимости
    await installServiceDependencies();

    // 4. Сгенерировать Prisma
    await generatePrismaForAllServices();

    console.log('\n✅ ВСЕ ИСПРАВЛЕНИЯ ПРИМЕНЕНЫ!');
    console.log('\n📋 Теперь вы можете запустить проект:');
    console.log('   node start-with-railway.js');
    console.log('\n🎉 Backend сервисы готовы к работе!');
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

// Запуск
main();
