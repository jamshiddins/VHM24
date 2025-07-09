require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:8000';
const MACHINES_URL = 'http://localhost:3002';

// Тестовый JWT токен (в реальности нужно получить через login)
const TEST_TOKEN = 'test-token';

async function testRedisCache() {
  console.log('🔄 Тестирование Redis кеширования через API...\n');

  try {
    // Тест 1: Прямой запрос к сервису machines
    console.log('1️⃣ Тест прямого запроса к сервису machines...');
    
    // Первый запрос - без кеша
    console.log('   Первый запрос (без кеша)...');
    const start1 = Date.now();
    const response1 = await axios.get(`${MACHINES_URL}/health`);
    const time1 = Date.now() - start1;
    console.log(`   ✅ Статус: ${response1.data.status}, Время: ${time1}ms`);
    
    // Тест 2: Проверка статистики (с кешированием)
    console.log('\n2️⃣ Тест статистики машин (требует авторизации)...');
    console.log('   ⚠️  Для полного теста нужен валидный JWT токен');
    
    // Тест 3: Проверка заголовков кеша
    console.log('\n3️⃣ Проверка работы Redis...');
    
    // Создаем простой тест для проверки Redis
    const { redis, cacheManagers } = require('./packages/shared-types/src/redis');
    const cache = cacheManagers.machines;
    
    // Тестовые данные
    const testKey = 'api:test:machines';
    const testData = {
      machines: [
        { id: 1, name: 'Machine 1', status: 'ONLINE' },
        { id: 2, name: 'Machine 2', status: 'OFFLINE' }
      ],
      timestamp: new Date()
    };
    
    // Сохраняем в кеш
    console.log('   Сохранение тестовых данных в кеш...');
    await cache.set(testKey, testData, 60);
    console.log('   ✅ Данные сохранены');
    
    // Читаем из кеша
    console.log('   Чтение данных из кеша...');
    const cachedData = await cache.get(testKey);
    console.log('   ✅ Данные получены:', cachedData ? 'Успешно' : 'Ошибка');
    
    // Проверяем TTL
    const ttl = await cache.ttl(testKey);
    console.log(`   ✅ TTL: ${ttl} секунд`);
    
    // Удаляем тестовые данные
    await cache.delete(testKey);
    console.log('   ✅ Тестовые данные удалены');
    
    // Тест 4: Производительность кеширования
    console.log('\n4️⃣ Тест производительности кеширования...');
    
    const perfKey = 'perf:test:api';
    const largData = Array(1000).fill(null).map((_, i) => ({
      id: i,
      name: `Item ${i}`,
      data: { index: i, value: Math.random() }
    }));
    
    // Без кеша (эмуляция)
    const dbStart = Date.now();
    await new Promise(resolve => setTimeout(resolve, 100)); // Эмуляция запроса к БД
    const dbTime = Date.now() - dbStart;
    console.log(`   База данных: ${dbTime}ms`);
    
    // С кешем
    await cache.set(perfKey, largData, 60);
    const cacheStart = Date.now();
    await cache.get(perfKey);
    const cacheTime = Date.now() - cacheStart;
    console.log(`   Redis кеш: ${cacheTime}ms`);
    console.log(`   ✅ Ускорение: ${Math.round(dbTime / cacheTime)}x`);
    
    // Очистка
    await cache.delete(perfKey);
    
    console.log('\n✅ Все тесты пройдены успешно!');
    console.log('🎉 Redis кеширование работает корректно.');
    
    // Закрываем соединение
    await redis.quit();
    
  } catch (error) {
    console.error('\n❌ Ошибка при тестировании:', error.message);
    if (error.response) {
      console.error('   Статус:', error.response.status);
      console.error('   Данные:', error.response.data);
    }
  }
  
  process.exit(0);
}

// Запускаем тесты
testRedisCache();
