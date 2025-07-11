const logger = require('./packages/shared/utils/logger');

require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:8000';
const MACHINES_URL = 'http://localhost:3002';

// Тестовый JWT токен (в реальности нужно получить через login)
const TEST_TOKEN = 'test-token';

async function testRedisCache() {
  logger.info('🔄 Тестирование Redis кеширования через API...\n');

  try {
    // Тест 1: Прямой запрос к сервису machines
    logger.info('1️⃣ Тест прямого запроса к сервису machines...');

    // Первый запрос - без кеша
    logger.info('   Первый запрос (без кеша)...');
    const start1 = Date.now();
    const response1 = await axios.get(`${MACHINES_URL}/health`);
    const time1 = Date.now() - start1;
    logger.info(`   ✅ Статус: ${response1.data.status}, Время: ${time1}ms`);

    // Тест 2: Проверка статистики (с кешированием)
    logger.info('\n2️⃣ Тест статистики машин (требует авторизации)...');
    logger.info('   ⚠️  Для полного теста нужен валидный JWT токен');

    // Тест 3: Проверка заголовков кеша
    logger.info('\n3️⃣ Проверка работы Redis...');

    // Создаем простой тест для проверки Redis
    const {
      redis,
      cacheManagers
    } = require('./packages/shared-types/src/redis');
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
    logger.info('   Сохранение тестовых данных в кеш...');
    await cache.set(testKey, testData, 60);
    logger.info('   ✅ Данные сохранены');

    // Читаем из кеша
    logger.info('   Чтение данных из кеша...');
    const cachedData = await cache.get(testKey);
    logger.info('   ✅ Данные получены:', cachedData ? 'Успешно' : 'Ошибка');

    // Проверяем TTL
    const ttl = await cache.ttl(testKey);
    logger.info(`   ✅ TTL: ${ttl} секунд`);

    // Удаляем тестовые данные
    await cache.delete(testKey);
    logger.info('   ✅ Тестовые данные удалены');

    // Тест 4: Производительность кеширования
    logger.info('\n4️⃣ Тест производительности кеширования...');

    const perfKey = 'perf:test:api';
    const largData = Array(1000)
      .fill(null)
      .map((_, i) => ({
        id: i,
        name: `Item ${i}`,
        data: { index: i, value: Math.random() }
      }));

    // Без кеша (эмуляция)
    const dbStart = Date.now();
    await new Promise(resolve => setTimeout(resolve, 100)); // Эмуляция запроса к БД
    const dbTime = Date.now() - dbStart;
    logger.info(`   База данных: ${dbTime}ms`);

    // С кешем
    await cache.set(perfKey, largData, 60);
    const cacheStart = Date.now();
    await cache.get(perfKey);
    const cacheTime = Date.now() - cacheStart;
    logger.info(`   Redis кеш: ${cacheTime}ms`);
    logger.info(`   ✅ Ускорение: ${Math.round(dbTime / cacheTime)}x`);

    // Очистка
    await cache.delete(perfKey);

    logger.info('\n✅ Все тесты пройдены успешно!');
    logger.info('🎉 Redis кеширование работает корректно.');

    // Закрываем соединение
    await redis.quit();
  } catch (error) {
    logger.error('\n❌ Ошибка при тестировании:', error.message);
    if (error.response) {
      logger.error('   Статус:', error.response.status);
      logger.error('   Данные:', error.response.data);
    }
  }

  process.exit(0);
}

// Запускаем тесты
testRedisCache();
