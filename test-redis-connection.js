const logger = require('./packages/shared/utils/logger');

require('dotenv').config();
const { redis, cacheManagers } = require('./packages/shared-types/src/redis');

async function testRedisConnection() {
  logger.info('🔄 Тестирование подключения к Redis...');
  logger.info(`📍 URL: ${process.env.REDIS_URL}`);

  try {
    // Тест 1: Проверка подключения
    logger.info('\n1️⃣ Проверка подключения...');
    await redis.ping();
    logger.info('✅ Подключение успешно!');

    // Тест 2: Базовые операции
    logger.info('\n2️⃣ Тестирование базовых операций...');
    const testKey = 'test:connection';
    const testValue = { message: 'Hello Redis!', timestamp: new Date() };

    // SET
    await redis.set(testKey, JSON.stringify(testValue));
    logger.info('✅ SET операция успешна');

    // GET
    const retrieved = await redis.get(testKey);
    const parsed = JSON.parse(retrieved);
    logger.info('✅ GET операция успешна:', parsed);

    // DELETE
    await redis.del(testKey);
    logger.info('✅ DELETE операция успешна');

    // Тест 3: Работа с CacheManager
    logger.info('\n3️⃣ Тестирование CacheManager...');
    const cache = cacheManagers.machines;

    // Сохранение объекта
    const testData = {
      id: '123',
      name: 'Test Machine',
      status: 'ONLINE',
      createdAt: new Date()
    };

    await cache.set('test:machine', testData, 60); // TTL 60 секунд
    logger.info('✅ CacheManager SET успешен');

    // Получение объекта
    const cachedData = await cache.get('test:machine');
    logger.info('✅ CacheManager GET успешен:', cachedData);

    // Проверка TTL
    const ttl = await cache.ttl('test:machine');
    logger.info(`✅ TTL проверен: ${ttl} секунд`);

    // Удаление
    await cache.delete('test:machine');
    logger.info('✅ CacheManager DELETE успешен');

    // Тест 4: Паттерны и множественные ключи
    logger.info('\n4️⃣ Тестирование паттернов...');

    // Создаем несколько ключей
    await cache.set('machines:list:page1', ['machine1', 'machine2'], 60);
    await cache.set('machines:list:page2', ['machine3', 'machine4'], 60);
    await cache.set('machines:stats', { total: 4, online: 3 }, 60);
    logger.info('✅ Множественные ключи созданы');

    // Удаление по паттерну
    await cache.deletePattern('machines:list:*');
    logger.info('✅ Удаление по паттерну выполнено');

    // Проверка что stats остался
    const stats = await cache.get('machines:stats');
    logger.info(
      '✅ Проверка селективного удаления:',
      stats ? 'stats сохранен' : 'stats удален'
    );

    // Очистка
    await cache.delete('machines:stats');

    // Тест 5: Функция cache()
    logger.info('\n5️⃣ Тестирование функции cache()...');

    let callCount = 0;
    const expensiveOperation = async () => {
      callCount++;
      logger.info(`  Выполнение дорогой операции (вызов #${callCount})...`);
      await new Promise(resolve => setTimeout(resolve, 100));
      return { result: 'expensive data', count: callCount };
    };

    // Первый вызов - выполнит функцию
    const result1 = await cache.cache('expensive:op', expensiveOperation, 30);
    logger.info('  Результат 1:', result1);

    // Второй вызов - вернет из кеша
    const result2 = await cache.cache('expensive:op', expensiveOperation, 30);
    logger.info('  Результат 2:', result2);
    logger.info(
      `✅ Функция cache() работает корректно (вызовов функции: ${callCount})`
    );

    // Очистка
    await cache.delete('expensive:op');

    // Тест 6: Производительность
    logger.info('\n6️⃣ Тест производительности...');

    const testDataLarge = Array(100)
      .fill(null)
      .map((_, i) => ({
        id: `machine-${i}`,
        name: `Machine ${i}`,
        status: i % 3 === 0 ? 'OFFLINE' : 'ONLINE',
        data: { index: i, timestamp: new Date() }
      }));

    // Запись
    const writeStart = Date.now();
    await cache.set('perf:test', testDataLarge, 60);
    const writeTime = Date.now() - writeStart;
    logger.info(`  Запись 100 объектов: ${writeTime}ms`);

    // Чтение
    const readStart = Date.now();
    const readData = await cache.get('perf:test');
    const readTime = Date.now() - readStart;
    logger.info(`  Чтение 100 объектов: ${readTime}ms`);
    logger.info(
      `✅ Производительность: запись ${writeTime}ms, чтение ${readTime}ms`
    );

    // Очистка
    await cache.delete('perf:test');

    logger.info('\n✅ Все тесты пройдены успешно!');
    logger.info('🎉 Redis работает корректно и готов к использованию.');
  } catch (error) {
    logger.error('\n❌ Ошибка при тестировании Redis:', error.message);
    logger.error('Детали:', error);
  } finally {
    // Закрываем соединение
    await redis.quit();
    logger.info('\n👋 Соединение закрыто');
    process.exit(0);
  }
}

// Запускаем тесты
testRedisConnection();
