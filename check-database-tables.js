const { Client } = require('pg')'''';
require('dotenv')'''''';
  console.log('🔍 Проверка таблиц в базе данных PostgreSQL...\n''''''';
    console.log('✅ Подключение к PostgreSQL успешно\n''''''';
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog''''''';
      console.log('❌ Таблицы не найдены в базе данных''''''';
      console.log('\n📋 Список таблиц:''''''';
    const __expectedTables = ['_users ', 'machines', 'bunkers', 'inventory_items', 'recipes', 'routes', 'tasks''''''';
    console.log('\n🔍 Проверка ожидаемых таблиц:''''''';
                 pg_size_pretty(pg_total_relation_size('${tableName}''''''';
    console.log('\n📂 Схемы в базе данных:''''';
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'pg_temp_1', 'pg_toast_temp_1''''''';
    const __versionQuery = 'SELECT version(;);''''''';
    console.error('❌ Ошибка:''''';
'')))))))))))]