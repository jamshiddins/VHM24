const { Client } = require('pg');
require('dotenv').config();

async function checkDatabaseTables() {
  console.log('🔍 Проверка таблиц в базе данных PostgreSQL...\n');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('✅ Подключение к PostgreSQL успешно\n');
    
    // Получаем список всех таблиц
    const tablesQuery = `
      SELECT 
        table_schema,
        table_name,
        table_type
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
      ORDER BY table_schema, table_name;
    `;
    
    const tablesResult = await client.query(tablesQuery);
    
    if (tablesResult.rows.length === 0) {
      console.log('❌ Таблицы не найдены в базе данных');
    } else {
      console.log(`📊 Найдено таблиц: ${tablesResult.rows.length}`);
      console.log('\n📋 Список таблиц:');
      
      tablesResult.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.table_schema}.${row.table_name} (${row.table_type})`);
      });
    }
    
    // Проверяем конкретные таблицы, которые ищет система тестирования
    const expectedTables = ['users', 'machines', 'bunkers', 'inventory_items', 'recipes', 'routes', 'tasks'];
    
    console.log('\n🔍 Проверка ожидаемых таблиц:');
    
    for (const tableName of expectedTables) {
      try {
        const checkQuery = `
          SELECT COUNT(*) as count, 
                 pg_size_pretty(pg_total_relation_size('${tableName}')) as size
          FROM ${tableName};
        `;
        const result = await client.query(checkQuery);
        console.log(`✅ ${tableName}: ${result.rows[0].count} записей, размер: ${result.rows[0].size}`);
      } catch (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
      }
    }
    
    // Проверяем схемы
    console.log('\n📂 Схемы в базе данных:');
    const schemasQuery = `
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'pg_temp_1', 'pg_toast_temp_1')
      ORDER BY schema_name;
    `;
    
    const schemasResult = await client.query(schemasQuery);
    schemasResult.rows.forEach(row => {
      console.log(`  - ${row.schema_name}`);
    });
    
    // Проверяем версию PostgreSQL
    const versionQuery = 'SELECT version();';
    const versionResult = await client.query(versionQuery);
    console.log(`\n🔧 PostgreSQL версия: ${versionResult.rows[0].version}`);
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await client.end();
  }
}

checkDatabaseTables();
