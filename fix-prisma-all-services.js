#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

console.log('🔧 Исправление Prisma для всех сервисов VHM24...\n');

// Генерация Prisma для конкретного пути
async function generatePrismaForPath(servicePath, serviceName) {
  console.log(`\n📦 Обработка ${serviceName}...`);
  
  try {
    // Генерируем Prisma с указанием output директории
    const schemaPath = path.join(__dirname, 'packages/database/prisma/schema.prisma');
    const outputPath = path.join(servicePath, 'node_modules/.prisma/client');
    
    // Создаем директорию для Prisma клиента
    await fs.mkdir(path.join(servicePath, 'node_modules/.prisma'), { recursive: true });
    
    // Генерируем Prisma клиент с указанием output
    const generateCmd = `npx prisma generate --schema="${schemaPath}" --generator="client={output=\\"${outputPath}\\"}"`;
    
    console.log(`  🔨 Генерация Prisma клиента...`);
    await exec(generateCmd, { cwd: servicePath });
    
    // Создаем index файлы для правильного импорта
    const indexContent = `
const { PrismaClient } = require('./runtime/library');
module.exports = { PrismaClient };
module.exports.PrismaClient = PrismaClient;
module.exports.default = { PrismaClient };
`;
    
    await fs.writeFile(path.join(outputPath, 'index.js'), indexContent);
    await fs.writeFile(path.join(outputPath, 'index.d.ts'), 'export * from "./runtime/library";');
    
    // Создаем символическую ссылку в node_modules/@prisma/client
    const prismaClientPath = path.join(servicePath, 'node_modules/@prisma/client');
    try {
      await fs.rm(prismaClientPath, { recursive: true, force: true });
    } catch (e) {
      // Игнорируем если не существует
    }
    
    await fs.mkdir(path.dirname(prismaClientPath), { recursive: true });
    await fs.symlink(outputPath, prismaClientPath, 'junction');
    
    console.log(`  ✅ Prisma клиент сгенерирован для ${serviceName}`);
    return true;
    
  } catch (error) {
    console.log(`  ❌ Ошибка для ${serviceName}:`, error.message);
    return false;
  }
}

// Исправление Prisma импортов в shared пакете
async function fixSharedPackage() {
  console.log('\n🔧 Исправление shared пакета...');
  
  try {
    const sharedPath = path.join(__dirname, 'packages/shared');
    await generatePrismaForPath(sharedPath, 'shared');
    
    // Обновляем middleware/security.js чтобы использовать правильный путь
    const securityPath = path.join(sharedPath, 'middleware/security.js');
    let securityContent = await fs.readFile(securityPath, 'utf8');
    
    // Заменяем импорт Prisma
    securityContent = securityContent.replace(
      /const\s*{\s*PrismaClient\s*}\s*=\s*require\(['"]\@prisma\/client['"]\);?/g,
      'const { PrismaClient } = require("../node_modules/.prisma/client");'
    );
    
    await fs.writeFile(securityPath, securityContent);
    console.log('  ✅ Исправлен security.js');
    
  } catch (error) {
    console.log('  ❌ Ошибка в shared:', error.message);
  }
}

// Главная функция
async function main() {
  console.log('🚀 Начинаем исправление Prisma для всех сервисов...\n');
  
  // 1. Сначала генерируем основной Prisma клиент
  console.log('📦 Генерация основного Prisma клиента...');
  try {
    await exec('npx prisma generate --schema=packages/database/prisma/schema.prisma');
    console.log('✅ Основной Prisma клиент сгенерирован');
  } catch (error) {
    console.log('⚠️  Ошибка генерации основного клиента:', error.message);
  }
  
  // 2. Исправляем shared пакет
  await fixSharedPackage();
  
  // 3. Генерируем Prisma для каждого сервиса
  const services = [
    { name: 'gateway', path: 'services/gateway' },
    { name: 'auth', path: 'services/auth' },
    { name: 'machines', path: 'services/machines' },
    { name: 'inventory', path: 'services/inventory' },
    { name: 'tasks', path: 'services/tasks' },
    { name: 'routes', path: 'services/routes' },
    { name: 'warehouse', path: 'services/warehouse' },
    { name: 'recipes', path: 'services/recipes' },
    { name: 'notifications', path: 'services/notifications' },
    { name: 'audit', path: 'services/audit' },
    { name: 'monitoring', path: 'services/monitoring' }
  ];
  
  for (const service of services) {
    const servicePath = path.join(__dirname, service.path);
    await generatePrismaForPath(servicePath, service.name);
  }
  
  console.log('\n✅ ВСЕ ИСПРАВЛЕНИЯ ПРИМЕНЕНЫ!');
  console.log('\n📋 Теперь запустите тестирование:');
  console.log('   node test-all-components.js');
  console.log('\n🚀 Или запустите проект:');
  console.log('   node start-with-railway.js');
}

// Запуск
main().catch(error => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
});
