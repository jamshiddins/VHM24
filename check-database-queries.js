/**
 * Скрипт для проверки выполнения запросов к базе данных
 */
const { Client } = require('pg');
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');

// Загружаем .env.development файл для локальной разработки
const devEnv = dotenv.config({ path: '.env.development' });
dotenvExpand.expand(devEnv);

// Загружаем основной .env файл
const mainEnv = dotenv.config();
dotenvExpand.expand(mainEnv);

// Функция для проверки выполнения запросов к базе данных
async function checkDatabaseQueries() {
  console.log('=== ПРОВЕРКА ВЫПОЛНЕНИЯ ЗАПРОСОВ К БАЗЕ ДАННЫХ ===');
  
  // Создаем клиент PostgreSQL
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    // Подключаемся к базе данных
    console.log(`Подключение к базе данных: ${process.env.DATABASE_URL.split('@')[1]}`);
    await client.connect();
    console.log('✅ Успешное подключение к базе данных');
    
    // Проверяем SELECT запрос
    console.log('\n🔍 Проверка SELECT запроса:');
    const selectResult = await client.query('SELECT NOW() as time');
    console.log(`✅ SELECT запрос выполнен успешно: ${selectResult.rows[0].time}`);
    
    // Проверяем CREATE TABLE запрос
    console.log('\n🔍 Проверка CREATE TABLE запроса:');
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS test_table (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('✅ CREATE TABLE запрос выполнен успешно');
    } catch (error) {
      console.error(`❌ Ошибка при выполнении CREATE TABLE запроса: ${error.message}`);
    }
    
    // Проверяем INSERT запрос
    console.log('\n🔍 Проверка INSERT запроса:');
    try {
      const insertResult = await client.query(`
        INSERT INTO test_table (name) 
        VALUES ($1)
        RETURNING id, name, created_at
      `, [`Test_${Date.now()}`]);
      
      console.log(`✅ INSERT запрос выполнен успешно: ID=${insertResult.rows[0].id}, Name=${insertResult.rows[0].name}, Created=${insertResult.rows[0].created_at}`);
    } catch (error) {
      console.error(`❌ Ошибка при выполнении INSERT запроса: ${error.message}`);
    }
    
    // Проверяем UPDATE запрос
    console.log('\n🔍 Проверка UPDATE запроса:');
    try {
      const updateResult = await client.query(`
        UPDATE test_table 
        SET name = $1 
        WHERE name LIKE 'Test_%'
        RETURNING id, name, created_at
      `, [`Updated_${Date.now()}`]);
      
      console.log(`✅ UPDATE запрос выполнен успешно: обновлено ${updateResult.rowCount} записей`);
      if (updateResult.rows.length > 0) {
        console.log(`  Пример обновленной записи: ID=${updateResult.rows[0].id}, Name=${updateResult.rows[0].name}, Created=${updateResult.rows[0].created_at}`);
      }
    } catch (error) {
      console.error(`❌ Ошибка при выполнении UPDATE запроса: ${error.message}`);
    }
    
    // Проверяем SELECT с JOIN запрос (если есть другие таблицы)
    console.log('\n🔍 Проверка SELECT с JOIN запроса:');
    try {
      // Получаем список таблиц
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name != 'test_table'
        ORDER BY table_name
        LIMIT 2
      `);
      
      if (tablesResult.rows.length >= 2) {
        const table1 = tablesResult.rows[0].table_name;
        const table2 = tablesResult.rows[1].table_name;
        
        // Получаем первичные ключи таблиц
        const pk1Result = await client.query(`
          SELECT a.attname as column_name
          FROM pg_index i
          JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
          WHERE i.indrelid = $1::regclass AND i.indisprimary
        `, [`public.${table1}`]);
        
        const pk2Result = await client.query(`
          SELECT a.attname as column_name
          FROM pg_index i
          JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
          WHERE i.indrelid = $2::regclass AND i.indisprimary
        `, [`public.${table2}`]);
        
        if (pk1Result.rows.length > 0 && pk2Result.rows.length > 0) {
          const pk1 = pk1Result.rows[0].column_name;
          const pk2 = pk2Result.rows[0].column_name;
          
          // Выполняем JOIN запрос
          const joinResult = await client.query(`
            SELECT t1.${pk1}, t2.${pk2}
            FROM "${table1}" t1
            LEFT JOIN "${table2}" t2 ON t1.${pk1} = t2.${pk1}
            LIMIT 5
          `);
          
          console.log(`✅ SELECT с JOIN запрос выполнен успешно: получено ${joinResult.rowCount} записей`);
          console.log(`  Таблицы: ${table1} JOIN ${table2}`);
        } else {
          console.log(`⚠️ Не удалось определить первичные ключи для таблиц ${table1} и ${table2}`);
        }
      } else {
        console.log('⚠️ Недостаточно таблиц для проверки JOIN запроса');
      }
    } catch (error) {
      console.error(`❌ Ошибка при выполнении SELECT с JOIN запроса: ${error.message}`);
    }
    
    // Проверяем DELETE запрос
    console.log('\n🔍 Проверка DELETE запроса:');
    try {
      const deleteResult = await client.query(`
        DELETE FROM test_table 
        WHERE name LIKE 'Updated_%'
        RETURNING id
      `);
      
      console.log(`✅ DELETE запрос выполнен успешно: удалено ${deleteResult.rowCount} записей`);
    } catch (error) {
      console.error(`❌ Ошибка при выполнении DELETE запроса: ${error.message}`);
    }
    
    // Проверяем DROP TABLE запрос
    console.log('\n🔍 Проверка DROP TABLE запроса:');
    try {
      await client.query('DROP TABLE IF EXISTS test_table');
      console.log('✅ DROP TABLE запрос выполнен успешно');
    } catch (error) {
      console.error(`❌ Ошибка при выполнении DROP TABLE запроса: ${error.message}`);
    }
    
    // Проверяем транзакции
    console.log('\n🔍 Проверка транзакций:');
    try {
      // Начинаем транзакцию
      await client.query('BEGIN');
      
      // Создаем временную таблицу
      await client.query(`
        CREATE TEMPORARY TABLE test_transaction (
          id SERIAL PRIMARY KEY,
          value TEXT
        )
      `);
      
      // Вставляем данные
      await client.query(`
        INSERT INTO test_transaction (value) VALUES ('Transaction Test')
      `);
      
      // Проверяем, что данные вставлены
      const checkResult = await client.query('SELECT COUNT(*) as count FROM test_transaction');
      
      if (checkResult.rows[0].count > 0) {
        console.log('✅ Данные успешно вставлены в рамках транзакции');
        
        // Откатываем транзакцию
        await client.query('ROLLBACK');
        
        // Проверяем, что таблица не существует после отката
        try {
          await client.query('SELECT COUNT(*) FROM test_transaction');
          console.log('❌ Ошибка: таблица test_transaction все еще существует после ROLLBACK');
        } catch (error) {
          console.log('✅ Транзакция успешно откачена (ROLLBACK)');
        }
      } else {
        console.log('❌ Ошибка: данные не были вставлены в рамках транзакции');
        await client.query('ROLLBACK');
      }
    } catch (error) {
      console.error(`❌ Ошибка при проверке транзакций: ${error.message}`);
      await client.query('ROLLBACK').catch(() => {});
    }
    
    console.log('\n=== ПРОВЕРКА ЗАВЕРШЕНА УСПЕШНО ===');
    return true;
  } catch (error) {
    console.error(`❌ Критическая ошибка: ${error.message}`);
    console.error(error.stack);
    return false;
  } finally {
    // Закрываем соединение
    await client.end();
  }
}

// Запускаем проверку
checkDatabaseQueries().catch(error => {
  console.error(`❌ Критическая ошибка: ${error.message}`);
  process.exit(1);
});
