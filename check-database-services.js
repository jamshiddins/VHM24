/**
 * Скрипт для проверки работы с базой данных из разных сервисов (API, Worker, Scheduler)
 */
const { Client } = require('pg');
const { createClient } = require('redis');
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');
const fs = require('fs');
const path = require('path');

// Функция для загрузки переменных окружения из файла
function loadEnvFile(envFile) {
  // Загружаем .env.development файл для локальной разработки
  const devEnv = dotenv.config({ path: '.env.development' });
  dotenvExpand.expand(devEnv);
  
  // Загружаем основной .env файл
  const mainEnv = dotenv.config();
  dotenvExpand.expand(mainEnv);
  
  // Загружаем специфичный файл, если указан
  if (envFile) {
    const specificEnv = dotenv.config({ path: envFile });
    dotenvExpand.expand(specificEnv);
  }
  
  return process.env;
}

// Функция для проверки подключения к базе данных
async function checkDatabaseConnection(serviceName, envFile) {
  console.log(`\n=== ПРОВЕРКА ПОДКЛЮЧЕНИЯ К БАЗЕ ДАННЫХ ИЗ ${serviceName.toUpperCase()} ===`);
  
  // Загружаем переменные окружения
  const env = loadEnvFile(envFile);
  
  // Создаем клиент PostgreSQL
  const client = new Client({
    connectionString: env.DATABASE_URL
  });
  
  try {
    // Подключаемся к базе данных
    console.log(`Подключение к базе данных: ${env.DATABASE_URL.split('@')[1]}`);
    await client.connect();
    console.log(`✅ ${serviceName}: Успешное подключение к базе данных`);
    
    // Проверяем версию PostgreSQL
    const versionResult = await client.query('SELECT version()');
    console.log(`✅ ${serviceName}: Версия PostgreSQL: ${versionResult.rows[0].version.split(',')[0]}`);
    
    // Проверяем простой запрос
    const testResult = await client.query('SELECT NOW() as time');
    console.log(`✅ ${serviceName}: Тестовый запрос выполнен успешно: ${testResult.rows[0].time}`);
    
    // Создаем временную таблицу для тестирования
    const tableName = `test_${serviceName.toLowerCase()}_${Date.now()}`;
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id SERIAL PRIMARY KEY,
        service VARCHAR(50) NOT NULL,
        message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Вставляем тестовую запись
    const insertResult = await client.query(`
      INSERT INTO ${tableName} (service, message)
      VALUES ($1, $2)
      RETURNING id, service, message, created_at
    `, [serviceName, `Test message from ${serviceName} at ${new Date().toISOString()}`]);
    
    console.log(`✅ ${serviceName}: Тестовая запись создана: ID=${insertResult.rows[0].id}, Message=${insertResult.rows[0].message}`);
    
    // Удаляем временную таблицу
    await client.query(`DROP TABLE IF EXISTS ${tableName}`);
    console.log(`✅ ${serviceName}: Временная таблица удалена`);
    
    return true;
  } catch (error) {
    console.error(`❌ ${serviceName}: Ошибка при работе с базой данных: ${error.message}`);
    console.error(error.stack);
    return false;
  } finally {
    // Закрываем соединение
    await client.end();
  }
}

// Функция для проверки подключения к Redis
async function checkRedisConnection(serviceName, envFile) {
  console.log(`\n=== ПРОВЕРКА ПОДКЛЮЧЕНИЯ К REDIS ИЗ ${serviceName.toUpperCase()} ===`);
  
  // Загружаем переменные окружения
  const env = loadEnvFile(envFile);
  
  if (!env.REDIS_URL) {
    console.error(`❌ ${serviceName}: REDIS_URL не настроен в переменных окружения`);
    return false;
  }
  
  // Создаем клиент Redis
  const redisClient = createClient({
    url: env.REDIS_URL,
    socket: {
      connectTimeout: 10000,
      reconnectStrategy: (retries) => Math.min(Math.pow(2, retries) * 100, 5000)
    }
  });
  
  // Обработка ошибок Redis
  redisClient.on('error', (err) => {
    console.error(`❌ ${serviceName}: Ошибка Redis: ${err.message}`);
  });
  
  try {
    // Подключаемся к Redis
    console.log(`Подключение к Redis: ${env.REDIS_URL.split('@')[1]}`);
    await redisClient.connect();
    console.log(`✅ ${serviceName}: Успешное подключение к Redis`);
    
    // Проверяем работу с Redis
    const testKey = `test_${serviceName.toLowerCase()}_${Date.now()}`;
    const testValue = `Test value from ${serviceName} at ${new Date().toISOString()}`;
    
    // Устанавливаем значение
    await redisClient.set(testKey, testValue);
    console.log(`✅ ${serviceName}: Тестовое значение установлено в Redis`);
    
    // Получаем значение
    const retrievedValue = await redisClient.get(testKey);
    console.log(`✅ ${serviceName}: Тестовое значение получено из Redis: ${retrievedValue}`);
    
    // Проверяем соответствие значений
    if (retrievedValue === testValue) {
      console.log(`✅ ${serviceName}: Значения соответствуют`);
    } else {
      console.error(`❌ ${serviceName}: Значения не соответствуют`);
    }
    
    // Удаляем тестовое значение
    await redisClient.del(testKey);
    console.log(`✅ ${serviceName}: Тестовое значение удалено из Redis`);
    
    return true;
  } catch (error) {
    console.error(`❌ ${serviceName}: Ошибка при работе с Redis: ${error.message}`);
    console.error(error.stack);
    return false;
  } finally {
    // Закрываем соединение
    await redisClient.quit().catch(() => {});
  }
}

// Главная функция для проверки всех сервисов
async function checkAllServices() {
  console.log('=== КОМПЛЕКСНАЯ ПРОВЕРКА РАБОТЫ С БАЗОЙ ДАННЫХ ИЗ РАЗНЫХ СЕРВИСОВ ===');
  
  // Проверяем API сервис
  const apiDbResult = await checkDatabaseConnection('API', '.env.api');
  const apiRedisResult = await checkRedisConnection('API', '.env.api');
  
  // Проверяем Worker сервис
  const workerDbResult = await checkDatabaseConnection('Worker', '.env.worker');
  const workerRedisResult = await checkRedisConnection('Worker', '.env.worker');
  
  // Проверяем Scheduler сервис
  const schedulerDbResult = await checkDatabaseConnection('Scheduler', '.env.scheduler');
  const schedulerRedisResult = await checkRedisConnection('Scheduler', '.env.scheduler');
  
  // Выводим итоговый результат
  console.log('\n=== ИТОГОВЫЙ РЕЗУЛЬТАТ ===');
  console.log('API:');
  console.log(`  - База данных: ${apiDbResult ? '✅ OK' : '❌ ОШИБКА'}`);
  console.log(`  - Redis: ${apiRedisResult ? '✅ OK' : '❌ ОШИБКА'}`);
  
  console.log('Worker:');
  console.log(`  - База данных: ${workerDbResult ? '✅ OK' : '❌ ОШИБКА'}`);
  console.log(`  - Redis: ${workerRedisResult ? '✅ OK' : '❌ ОШИБКА'}`);
  
  console.log('Scheduler:');
  console.log(`  - База данных: ${schedulerDbResult ? '✅ OK' : '❌ ОШИБКА'}`);
  console.log(`  - Redis: ${schedulerRedisResult ? '✅ OK' : '❌ ОШИБКА'}`);
  
  // Проверяем общий результат
  const allResults = [
    apiDbResult, apiRedisResult,
    workerDbResult, workerRedisResult,
    schedulerDbResult, schedulerRedisResult
  ];
  
  const successCount = allResults.filter(result => result).length;
  const totalCount = allResults.length;
  
  console.log(`\nОбщий результат: ${successCount}/${totalCount} проверок успешно`);
  
  if (successCount === totalCount) {
    console.log('✅ Все проверки успешно пройдены');
  } else {
    console.log(`⚠️ ${totalCount - successCount} проверок не пройдено`);
  }
  
  console.log('\n=== ПРОВЕРКА ЗАВЕРШЕНА ===');
}

// Запускаем проверку
checkAllServices().catch(error => {
  console.error(`❌ Критическая ошибка: ${error.message}`);
  process.exit(1);
});
