/**
 * Скрипт для проверки подключения к Redis в Railway
 */
const { createClient } = require('redis');
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');

// Загружаем .env.railway файл для подключения к Railway
const railwayEnv = dotenv.config({ path: '.env.railway' });
dotenvExpand.expand(railwayEnv);

// Функция для проверки подключения к Redis
async function checkRedisConnection() {
  console.log('=== ПРОВЕРКА ПОДКЛЮЧЕНИЯ К REDIS В RAILWAY ===');
  
  // Выбор URL для подключения к Redis
  // Для проверки подключения из локальной среды используем публичный URL
  const redisUrl = process.env.REDIS_URL_PUBLIC || process.env.REDIS_URL;
  
  // Проверяем наличие переменной окружения REDIS_URL
  if (!redisUrl) {
    console.error('❌ REDIS_URL_PUBLIC и REDIS_URL не настроены в переменных окружения');
    return false;
  }
  
  console.log(`Подключение к Redis: ${redisUrl.split('@')[1]}`);
  
  // Создаем клиент Redis
  const redisClient = createClient({
    url: redisUrl,
    socket: {
      connectTimeout: 10000,
      reconnectStrategy: (retries) => Math.min(Math.pow(2, retries) * 100, 5000)
    }
  });
  
  // Обработка ошибок Redis
  redisClient.on('error', (err) => {
    console.error(`❌ Ошибка Redis: ${err.message}`);
  });
  
  try {
    // Подключаемся к Redis
    await redisClient.connect();
    console.log('✅ Успешное подключение к Redis');
    
    // Проверяем работу с Redis
    const testKey = `test_${Date.now()}`;
    const testValue = `Test value at ${new Date().toISOString()}`;
    
    // Устанавливаем значение
    await redisClient.set(testKey, testValue);
    console.log(`✅ Тестовое значение установлено в Redis: ${testKey} = ${testValue}`);
    
    // Получаем значение
    const retrievedValue = await redisClient.get(testKey);
    console.log(`✅ Тестовое значение получено из Redis: ${retrievedValue}`);
    
    // Проверяем соответствие значений
    if (retrievedValue === testValue) {
      console.log(`✅ Значения соответствуют`);
    } else {
      console.error(`❌ Значения не соответствуют`);
    }
    
    // Удаляем тестовое значение
    await redisClient.del(testKey);
    console.log(`✅ Тестовое значение удалено из Redis`);
    
    // Получаем информацию о Redis
    const info = await redisClient.info();
    console.log(`✅ Информация о Redis:`);
    console.log(info);
    
    console.log('=== ПРОВЕРКА ЗАВЕРШЕНА УСПЕШНО ===');
    return true;
  } catch (error) {
    console.error(`❌ Ошибка при подключении к Redis: ${error.message}`);
    console.error(error.stack);
    return false;
  } finally {
    // Закрываем соединение
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
  }
}

// Запускаем проверку
checkRedisConnection().catch(error => {
  console.error(`❌ Критическая ошибка: ${error.message}`);
  process.exit(1);
});
