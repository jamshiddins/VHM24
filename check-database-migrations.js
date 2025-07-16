/**
 * Скрипт для проверки миграций базы данных
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');
const { Client } = require('pg');

// Загружаем .env.development файл для локальной разработки
const devEnv = dotenv.config({ path: '.env.development' });
dotenvExpand.expand(devEnv);

// Загружаем основной .env файл
const mainEnv = dotenv.config();
dotenvExpand.expand(mainEnv);

// Функция для выполнения команды и возврата результата
function executeCommand(command, options = {}) {
  try {
    console.log(`Выполнение команды: ${command}`);
    const result = execSync(command, { encoding: 'utf8', ...options });
    return result.trim();
  } catch (error) {
    console.error(`Ошибка выполнения команды: ${error.message}`);
    if (error.stdout) console.error(`Вывод stdout: ${error.stdout}`);
    if (error.stderr) console.error(`Вывод stderr: ${error.stderr}`);
    throw error;
  }
}

// Функция для проверки миграций базы данных
async function checkDatabaseMigrations() {
  console.log('=== ПРОВЕРКА МИГРАЦИЙ БАЗЫ ДАННЫХ ===');
  
  // Проверяем наличие директории с миграциями
  const migrationsDir = path.join(__dirname, 'backend', 'prisma', 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.error('❌ Директория с миграциями не найдена');
    return false;
  }
  
  // Получаем список миграций
  const migrations = fs.readdirSync(migrationsDir)
    .filter(dir => dir !== 'migration_lock.toml' && fs.statSync(path.join(migrationsDir, dir)).isDirectory())
    .sort();
  
  console.log(`✅ Найдено ${migrations.length} миграций:`);
  
  // Выводим список миграций
  for (const migration of migrations) {
    console.log(`  - ${migration}`);
    
    // Проверяем наличие файлов миграции
    const migrationDir = path.join(migrationsDir, migration);
    const migrationFiles = fs.readdirSync(migrationDir);
    
    console.log(`    Файлы (${migrationFiles.length}):`);
    
    for (const file of migrationFiles) {
      console.log(`      - ${file}`);
    }
    
    // Проверяем содержимое файла migration.sql
    const migrationSqlPath = path.join(migrationDir, 'migration.sql');
    
    if (fs.existsSync(migrationSqlPath)) {
      const migrationSql = fs.readFileSync(migrationSqlPath, 'utf8');
      const sqlLines = migrationSql.split('\n').filter(line => line.trim() !== '');
      
      console.log(`    SQL-запросы: ${sqlLines.length} строк`);
    } else {
      console.warn('⚠️ Файл migration.sql не найден');
    }
  }
  
  // Проверяем статус миграций в базе данных
  console.log('\n🔍 Проверка статуса миграций в базе данных:');
  
  // Создаем клиент PostgreSQL
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    // Подключаемся к базе данных
    await client.connect();
    console.log('✅ Успешное подключение к базе данных');
    
    // Проверяем наличие таблицы _prisma_migrations
    const tableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '_prisma_migrations'
      ) as exists
    `);
    
    if (!tableResult.rows[0].exists) {
      console.error('❌ Таблица _prisma_migrations не найдена в базе данных');
      return false;
    }
    
    console.log('✅ Таблица _prisma_migrations найдена в базе данных');
    
    // Получаем список примененных миграций
    const appliedMigrationsResult = await client.query(`
      SELECT id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count
      FROM _prisma_migrations
      ORDER BY started_at
    `);
    
    const appliedMigrations = appliedMigrationsResult.rows;
    
    console.log(`✅ Найдено ${appliedMigrations.length} примененных миграций в базе данных:`);
    
    // Выводим список примененных миграций
    for (const migration of appliedMigrations) {
      const status = migration.rolled_back_at ? '❌ Откачена' : (migration.finished_at ? '✅ Применена' : '⚠️ В процессе');
      console.log(`  - ${migration.migration_name} (${status})`);
      console.log(`    ID: ${migration.id}`);
      console.log(`    Начало: ${migration.started_at}`);
      console.log(`    Завершение: ${migration.finished_at || 'N/A'}`);
      console.log(`    Шаги: ${migration.applied_steps_count}`);
      
      if (migration.rolled_back_at) {
        console.log(`    Откат: ${migration.rolled_back_at}`);
      }
      
      console.log('');
    }
    
    // Проверяем соответствие миграций в файловой системе и базе данных
    console.log('\n🔍 Проверка соответствия миграций в файловой системе и базе данных:');
    
    const appliedMigrationNames = appliedMigrations.map(m => m.migration_name);
    const missingMigrations = migrations.filter(m => !appliedMigrationNames.includes(m));
    const extraMigrations = appliedMigrationNames.filter(m => !migrations.includes(m));
    
    if (missingMigrations.length > 0) {
      console.warn(`⚠️ Найдены миграции в файловой системе, которые не применены в базе данных: ${missingMigrations.join(', ')}`);
    } else {
      console.log('✅ Все миграции из файловой системы применены в базе данных');
    }
    
    if (extraMigrations.length > 0) {
      console.warn(`⚠️ Найдены миграции в базе данных, которые отсутствуют в файловой системе: ${extraMigrations.join(', ')}`);
    } else {
      console.log('✅ Все миграции из базы данных присутствуют в файловой системе');
    }
    
    // Проверяем структуру базы данных
    console.log('\n🔍 Проверка структуры базы данных:');
    
    // Получаем список таблиц
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    
    console.log(`✅ Найдено ${tables.length} таблиц в базе данных:`);
    
    // Выводим список таблиц
    for (const table of tables) {
      console.log(`  - ${table}`);
    }
    
    // Проверяем соответствие таблиц в схеме Prisma и базе данных
    const prismaSchemaPath = path.join(__dirname, 'backend', 'prisma', 'schema.prisma');
    
    if (fs.existsSync(prismaSchemaPath)) {
      const prismaSchema = fs.readFileSync(prismaSchemaPath, 'utf8');
      
      // Извлекаем модели из схемы Prisma
      const modelRegex = /model\s+(\w+)\s+{[^}]+@@map\("([^"]+)"\)/g;
      const prismaModels = [];
      let match;
      
      while ((match = modelRegex.exec(prismaSchema)) !== null) {
        prismaModels.push({
          name: match[1],
          tableName: match[2]
        });
      }
      
      console.log(`✅ Найдено ${prismaModels.length} моделей в схеме Prisma:`);
      
      // Выводим список моделей
      for (const model of prismaModels) {
        const existsInDb = tables.includes(model.tableName);
        console.log(`  - ${model.name} (таблица: ${model.tableName}) - ${existsInDb ? '✅ Существует в БД' : '❌ Отсутствует в БД'}`);
      }
      
      // Проверяем наличие всех таблиц из схемы Prisma в базе данных
      const missingTables = prismaModels.filter(model => !tables.includes(model.tableName));
      
      if (missingTables.length > 0) {
        console.warn(`⚠️ Найдены модели в схеме Prisma, для которых отсутствуют таблицы в базе данных: ${missingTables.map(m => m.name).join(', ')}`);
      } else {
        console.log('✅ Все модели из схемы Prisma имеют соответствующие таблицы в базе данных');
      }
    } else {
      console.warn('⚠️ Файл schema.prisma не найден');
    }
    
    console.log('\n=== ПРОВЕРКА ЗАВЕРШЕНА УСПЕШНО ===');
    return true;
  } catch (error) {
    console.error(`❌ Ошибка при проверке миграций: ${error.message}`);
    console.error(error.stack);
    return false;
  } finally {
    // Закрываем соединение
    await client.end();
  }
}

// Запускаем проверку
checkDatabaseMigrations().catch(error => {
  console.error(`❌ Критическая ошибка: ${error.message}`);
  process.exit(1);
});
