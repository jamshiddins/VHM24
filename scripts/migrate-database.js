/**
 * VHM24 - VendHub Manager 24/7
 * Скрипт для миграции базы данных
 * 
 * Использование:
 * node scripts/migrate-database.js [options]
 * 
 * Опции:
 * --create: создать новую миграцию
 * --name=NAME: имя миграции (обязательно при --create)
 * --deploy: применить все миграции
 * --reset: сбросить базу данных и применить все миграции (только для разработки)
 * --status: показать статус миграций
 */

require('dotenv').config();
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;

const execAsync = promisify(exec);

// Конфигурация
const config = {
  create: process.argv.includes('--create'),
  deploy: process.argv.includes('--deploy'),
  reset: process.argv.includes('--reset'),
  status: process.argv.includes('--status'),
  name: process.argv.find(arg => arg.startsWith('--name='))?.split('=')[1],
  schemaPath: path.join(process.cwd(), 'packages/database/prisma/schema.prisma'),
  migrationsDir: path.join(process.cwd(), 'packages/database/prisma/migrations')
};

// Проверка наличия Prisma схемы
async function checkSchema() {
  try {
    await fs.access(config.schemaPath);
    console.log(`✅ Prisma schema найдена: ${config.schemaPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Prisma schema не найдена: ${config.schemaPath}`);
    return false;
  }
}

// Создание новой миграции
async function createMigration() {
  if (!config.name) {
    console.error('❌ Не указано имя миграции. Используйте --name=NAME');
    process.exit(1);
  }
  
  try {
    console.log(`🔄 Создание новой миграции: ${config.name}`);
    
    const command = `npx prisma migrate dev --name ${config.name} --schema=${config.schemaPath} --create-only`;
    const { stdout, stderr } = await execAsync(command);
    
    console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log(`✅ Миграция создана: ${config.name}`);
    
    // Показываем путь к файлу миграции
    const migrations = await fs.readdir(config.migrationsDir);
    const latestMigration = migrations
      .filter(dir => dir.includes(config.name))
      .sort()
      .pop();
    
    if (latestMigration) {
      const migrationPath = path.join(config.migrationsDir, latestMigration, 'migration.sql');
      console.log(`📝 Файл миграции: ${migrationPath}`);
      console.log('Отредактируйте файл миграции при необходимости, затем примените миграцию с помощью --deploy');
    }
  } catch (error) {
    console.error('❌ Ошибка при создании миграции:', error.message);
    process.exit(1);
  }
}

// Применение миграций
async function deployMigrations() {
  try {
    console.log('🔄 Применение миграций...');
    
    const command = `npx prisma migrate deploy --schema=${config.schemaPath}`;
    const { stdout, stderr } = await execAsync(command);
    
    console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log('✅ Миграции применены');
    
    // Генерация Prisma клиента
    await generateClient();
  } catch (error) {
    console.error('❌ Ошибка при применении миграций:', error.message);
    process.exit(1);
  }
}

// Сброс базы данных
async function resetDatabase() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Сброс базы данных запрещен в production режиме');
    process.exit(1);
  }
  
  try {
    console.log('⚠️ Сброс базы данных...');
    
    const command = `npx prisma migrate reset --schema=${config.schemaPath} --force`;
    const { stdout, stderr } = await execAsync(command);
    
    console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log('✅ База данных сброшена и миграции применены');
  } catch (error) {
    console.error('❌ Ошибка при сбросе базы данных:', error.message);
    process.exit(1);
  }
}

// Показать статус миграций
async function showStatus() {
  try {
    console.log('🔍 Проверка статуса миграций...');
    
    // Получаем список миграций
    const migrations = await fs.readdir(config.migrationsDir);
    console.log(`📋 Найдено ${migrations.length} миграций:`);
    
    for (const migration of migrations) {
      const migrationPath = path.join(config.migrationsDir, migration);
      const stats = await fs.stat(migrationPath);
      console.log(`- ${migration} (${stats.mtime.toISOString()})`);
    }
    
    // Проверяем статус миграций в базе данных
    try {
      const command = `npx prisma migrate status --schema=${config.schemaPath}`;
      const { stdout, stderr } = await execAsync(command);
      
      console.log('\n📊 Статус миграций в базе данных:');
      console.log(stdout);
      if (stderr) console.error(stderr);
    } catch (error) {
      console.error('❌ Ошибка при проверке статуса миграций в базе данных:', error.message);
    }
  } catch (error) {
    console.error('❌ Ошибка при проверке статуса миграций:', error.message);
    process.exit(1);
  }
}

// Генерация Prisma клиента
async function generateClient() {
  try {
    console.log('🔄 Генерация Prisma клиента...');
    
    const command = `npx prisma generate --schema=${config.schemaPath}`;
    const { stdout, stderr } = await execAsync(command);
    
    console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log('✅ Prisma клиент сгенерирован');
  } catch (error) {
    console.error('❌ Ошибка при генерации Prisma клиента:', error.message);
    process.exit(1);
  }
}

// Главная функция
async function main() {
  console.log(`
🚀 VHM24 - Миграция базы данных
⏰ Дата: ${new Date().toISOString()}
  `);
  
  // Проверяем наличие Prisma схемы
  const schemaExists = await checkSchema();
  if (!schemaExists) {
    process.exit(1);
  }
  
  // Проверяем, что указана хотя бы одна опция
  if (!config.create && !config.deploy && !config.reset && !config.status) {
    console.error('❌ Не указана опция. Используйте --create, --deploy, --reset или --status');
    process.exit(1);
  }
  
  // Выполняем действия в зависимости от опций
  if (config.create) {
    await createMigration();
  } else if (config.deploy) {
    await deployMigrations();
  } else if (config.reset) {
    await resetDatabase();
  } else if (config.status) {
    await showStatus();
  }
}

// Запуск
main()
  .then(() => {
    console.log('✅ Операция завершена успешно');
  })
  .catch(error => {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  });
