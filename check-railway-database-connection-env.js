/**
 * Скрипт для проверки подключения к базе данных Railway через переменную DATABASE_URL
 */
const { Client } = require('pg');

// Функция для проверки подключения к базе данных
async function checkDatabaseConnection() {
  console.log('=== ПРОВЕРКА ПОДКЛЮЧЕНИЯ К БАЗЕ ДАННЫХ RAILWAY ЧЕРЕЗ DATABASE_URL ===');
  
  // Используем DATABASE_URL для подключения к базе данных
  const databaseUrl = process.env.DATABASE_URL;
  
  // Проверяем наличие переменной окружения DATABASE_URL
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL не настроен в переменных окружения');
    return false;
  }
  
  console.log(`Строка подключения: ${databaseUrl}`);
  
  // Разбираем строку подключения
  const match = databaseUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) {
    console.error('❌ Неверный формат строки подключения');
    return false;
  }
  
  const [, user, password, host, port, database] = match;
  
  console.log(`Подключение к базе данных: ${host}:${port}/${database}`);
  
  const client = new Client({
    user,
    password,
    host,
    port,
    database,
    ssl: {
      rejectUnauthorized: false // Для подключения к Railway PostgreSQL через SSL
    },
    connectionTimeoutMillis: 30000, // Увеличиваем таймаут подключения до 30 секунд
    query_timeout: 30000 // Увеличиваем таймаут запроса до 30 секунд
  });
  
  try {
    // Подключаемся к базе данных
    await client.connect();
    console.log('✅ Успешное подключение к базе данных');
    
    // Проверяем версию PostgreSQL
    const versionResult = await client.query('SELECT version()');
    console.log(`✅ Версия PostgreSQL: ${versionResult.rows[0].version}`);
    
    // Получаем список таблиц
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(`✅ Найдено ${tablesResult.rows.length} таблиц в базе данных:`);
    
    // Выводим список таблиц
    for (const row of tablesResult.rows) {
      console.log(`  - ${row.table_name}`);
      
      // Получаем список колонок для таблицы
      const columnsResult = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [row.table_name]);
      
      console.log(`    Колонки (${columnsResult.rows.length}):`);
      
      // Выводим список колонок
      for (const column of columnsResult.rows) {
        console.log(`      - ${column.column_name} (${column.data_type})`);
      }
      
      // Получаем количество записей в таблице
      const countResult = await client.query(`
        SELECT COUNT(*) as count FROM "${row.table_name}"
      `);
      
      console.log(`    Количество записей: ${countResult.rows[0].count}`);
      console.log('');
    }
    
    // Получаем список индексов
    const indexesResult = await client.query(`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);
    
    console.log(`✅ Найдено ${indexesResult.rows.length} индексов в базе данных:`);
    
    // Выводим список индексов
    for (const row of indexesResult.rows) {
      console.log(`  - ${row.indexname} (таблица: ${row.tablename})`);
    }
    
    // Проверяем размер базы данных
    const dbSizeResult = await client.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `);
    
    console.log(`✅ Размер базы данных: ${dbSizeResult.rows[0].size}`);
    
    // Проверяем активные соединения
    const connectionsResult = await client.query(`
      SELECT count(*) as count
      FROM pg_stat_activity
      WHERE datname = current_database()
    `);
    
    console.log(`✅ Активные соединения: ${connectionsResult.rows[0].count}`);
    
    console.log('=== ПРОВЕРКА ЗАВЕРШЕНА УСПЕШНО ===');
    return true;
  } catch (error) {
    console.error(`❌ Ошибка при подключении к базе данных: ${error.message}`);
    console.error(error.stack);
    return false;
  } finally {
    // Закрываем соединение
    await client.end();
  }
}

// Запускаем проверку
checkDatabaseConnection().catch(error => {
  console.error(`❌ Критическая ошибка: ${error.message}`);
  process.exit(1);
});
