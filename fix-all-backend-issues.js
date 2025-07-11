#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

console.log(
  '🔧 Комплексное исправление всех проблем backend сервисов VHM24...\n'
);

// 1. Установка глобальных зависимостей
async function installGlobalDependencies() {
  console.log('📦 Установка глобальных зависимостей...');

  try {
    // Устанавливаем Prisma глобально
    await exec('npm install -g prisma @prisma/client');
    console.log('✅ Глобальные зависимости установлены');
  } catch (error) {
    console.log('⚠️  Ошибка установки глобальных зависимостей:', error.message);
  }
}

// 2. Создание единого Prisma клиента для всех сервисов
async function createUnifiedPrismaClient() {
  console.log('\n📦 Создание единого Prisma клиента...');

  try {
    // Создаем папку для единого клиента
    const unifiedClientPath = path.join(__dirname, 'packages/prisma-client');
    await fs.mkdir(unifiedClientPath, { recursive: true });

    // Копируем схему
    const schemaSource = path.join(
      __dirname,
      'packages/database/prisma/schema.prisma'
    );
    const schemaDest = path.join(unifiedClientPath, 'schema.prisma');
    await fs.copyFile(schemaSource, schemaDest);

    // Создаем package.json
    const packageJson = {
      name: '@vhm24/prisma-client',
      version: '1.0.0',
      main: 'index.js',
      scripts: {
        generate: 'prisma generate'
      },
      dependencies: {
        '@prisma/client': '^6.11.1'
      }
    };

    await fs.writeFile(
      path.join(unifiedClientPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Устанавливаем зависимости
    console.log('  📦 Установка зависимостей...');
    await exec('npm install', { cwd: unifiedClientPath });

    // Генерируем Prisma клиент
    console.log('  🔨 Генерация Prisma клиента...');
    await exec('npx prisma generate --schema=schema.prisma', {
      cwd: unifiedClientPath
    });

    // Создаем index.js для экспорта
    const indexContent = `
const { PrismaClient } = require('@prisma/client');

// Создаем единственный экземпляр клиента
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Экспортируем для использования в других модулях
module.exports = { PrismaClient, prisma };
`;

    await fs.writeFile(path.join(unifiedClientPath, 'index.js'), indexContent);

    console.log('✅ Единый Prisma клиент создан');
    return true;
  } catch (error) {
    console.log('❌ Ошибка создания единого клиента:', error.message);
    return false;
  }
}

// 3. Обновление всех сервисов для использования единого клиента
async function updateServicesToUseUnifiedClient() {
  console.log('\n📝 Обновление сервисов для использования единого клиента...');

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

  for (const service of services) {
    try {
      const servicePath = path.join(__dirname, 'services', service);
      const packageJsonPath = path.join(servicePath, 'package.json');

      // Читаем package.json
      const packageJson = JSON.parse(
        await fs.readFile(packageJsonPath, 'utf8')
      );

      // Добавляем зависимость на единый клиент
      if (!packageJson.dependencies) {
        packageJson.dependencies = {};
      }
      packageJson.dependencies['@vhm24/prisma-client'] =
        'file:../../packages/prisma-client';

      // Удаляем прямую зависимость от @prisma/client
      delete packageJson.dependencies['@prisma/client'];

      // Сохраняем обновленный package.json
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));

      console.log(`✅ Обновлен ${service}`);
    } catch (error) {
      console.log(`⚠️  Ошибка обновления ${service}:`, error.message);
    }
  }
}

// 4. Исправление импортов Prisma во всех файлах
async function fixPrismaImports() {
  console.log('\n🔧 Исправление импортов Prisma...');

  const filesToFix = [
    'packages/shared/middleware/security.js',
    'services/gateway/src/index.js',
    'services/auth/src/index.js',
    'services/auth/src/controllers/authController.js',
    'services/machines/src/index.js',
    'services/inventory/src/index.js',
    'services/tasks/src/index.js',
    'services/routes/src/index.js',
    'services/warehouse/src/index.js',
    'services/recipes/src/index.js',
    'services/notifications/src/index.js',
    'services/audit/src/index.js',
    'services/monitoring/src/index.js'
  ];

  for (const filePath of filesToFix) {
    try {
      const fullPath = path.join(__dirname, filePath);
      let content = await fs.readFile(fullPath, 'utf8');

      // Заменяем импорты
      content = content.replace(
        /const\s*{\s*PrismaClient\s*}\s*=\s*require\s*\(\s*['"]@prisma\/client['"]\s*\)/g,
        "const { PrismaClient, prisma } = require('@vhm24/prisma-client')"
      );

      // Заменяем создание нового клиента на использование единого
      content = content.replace(
        /const\s+prisma\s*=\s*new\s+PrismaClient\s*\([^)]*\)/g,
        '// Используем единый Prisma клиент из @vhm24/prisma-client'
      );

      await fs.writeFile(fullPath, content);
      console.log(`✅ Исправлен ${path.basename(filePath)}`);
    } catch (error) {
      console.log(`⚠️  Не удалось исправить ${filePath}:`, error.message);
    }
  }
}

// 5. Установка зависимостей для всех сервисов
async function installAllDependencies() {
  console.log('\n📦 Установка зависимостей для всех сервисов...');

  const services = [
    'services/gateway',
    'services/auth',
    'services/machines',
    'services/inventory',
    'services/tasks',
    'services/routes',
    'services/warehouse',
    'services/recipes',
    'services/notifications',
    'services/audit',
    'services/monitoring'
  ];

  for (const service of services) {
    try {
      console.log(`  📦 Установка для ${path.basename(service)}...`);
      await exec('npm install', { cwd: path.join(__dirname, service) });
      console.log(`  ✅ ${path.basename(service)} готов`);
    } catch (error) {
      console.log(`  ⚠️  Ошибка для ${path.basename(service)}:`, error.message);
    }
  }
}

// 6. Создание тестового скрипта
async function createTestScript() {
  console.log('\n📝 Создание тестового скрипта...');

  const testScript = `#!/usr/bin/env node

const { prisma } = require('./packages/prisma-client');

async function testConnection() {
  console.log('🧪 Тестирование подключения к базе данных...');
  
  try {
    await prisma.$connect();
    const result = await prisma.$queryRaw\`SELECT 1 as test\`;
    console.log('✅ Подключение успешно:', result);
    
    // Тест создания пользователя
    const testUser = await prisma.user.create({
      data: {
        telegramId: 'test_' + Date.now(),
        username: 'test_user',
        role: 'operator',
        isActive: true
      }
    });
    console.log('✅ Тестовый пользователь создан:', testUser.id);
    
    // Удаляем тестового пользователя
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log('✅ Тестовый пользователь удален');
    
    await prisma.$disconnect();
    console.log('✅ Все тесты пройдены успешно!');
  } catch (error) {
    console.error('❌ Ошибка:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testConnection();
`;

  await fs.writeFile(
    path.join(__dirname, 'test-prisma-connection.js'),
    testScript
  );
  console.log('✅ Тестовый скрипт создан');
}

// Главная функция
async function main() {
  console.log('🚀 Начинаем комплексное исправление...\n');

  try {
    // 1. Устанавливаем глобальные зависимости
    await installGlobalDependencies();

    // 2. Создаем единый Prisma клиент
    const clientCreated = await createUnifiedPrismaClient();

    if (clientCreated) {
      // 3. Обновляем сервисы
      await updateServicesToUseUnifiedClient();

      // 4. Исправляем импорты
      await fixPrismaImports();

      // 5. Устанавливаем зависимости
      await installAllDependencies();

      // 6. Создаем тестовый скрипт
      await createTestScript();
    }

    console.log('\n✅ ВСЕ ИСПРАВЛЕНИЯ ПРИМЕНЕНЫ!');
    console.log('\n📋 Дальнейшие действия:');
    console.log('1. Протестируйте подключение:');
    console.log('   node test-prisma-connection.js');
    console.log('\n2. Запустите все компоненты:');
    console.log('   node test-all-components.js');
    console.log('\n3. Запустите проект:');
    console.log('   node start-with-railway.js');
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  }
}

// Запуск
main();
