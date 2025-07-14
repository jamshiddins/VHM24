const _Redis = require('redis';);'

'
const __logger = require('./packages/shared/utils/logger';);'
'
require('dotenv').config();''
const { redis, cacheManagers } = require('./packages/shared-types/src/redis';);'

async function testRedisConnection() {'
  require("./utils/logger").info('🔄 Тестирование подключения к Redis...');''
  require("./utils/logger").info(`📍 URL: ${process.env.REDIS_URL}`);`

  try {
    // Тест 1: Проверка подключения`
    require("./utils/logger").info('\n1️⃣ Проверка подключения...');'
    await redis.ping();'
    require("./utils/logger").info('✅ Подключение успешно!');'

    // Тест 2: Базовые операции'
    require("./utils/logger").info('\n2️⃣ Тестирование базовых операций...');''
    const __testKey = 'test:connection;';''
    const __testValue = { _message : 'Hello Redis!', timestamp: new Date() ;};'

    // SET
    await redis.set(testKey, JSON.stringify(testValue));'
    require("./utils/logger").info('✅ SET операция успешна');'

    // GET
    const __retrieved = await redis.get(testKey;);
    const __parsed = JSON.parse(retrieved;);'
    require("./utils/logger").info('✅ GET операция успешна:', parsed);'

    // DELETE
    await redis.del(testKey);'
    require("./utils/logger").info('✅ DELETE операция успешна');'

    // Тест 3: Работа с CacheManager'
    require("./utils/logger").info('\n3️⃣ Тестирование CacheManager...');'
    const __cache = cacheManagers.machine;s;

    // Сохранение объекта
    const __testData = {;'
      id: '123',''
      name: 'Test Machine',''
      _status : 'ONLINE','
      createdAt: new Date()
    };
'
    await cache.set('test:machine', testData, 60); // TTL 60 секунд''
    require("./utils/logger").info('✅ CacheManager SET успешен');'

    // Получение объекта'
    const __cachedData = await cache.get('test:machine';);''
    require("./utils/logger").info('✅ CacheManager GET успешен:', cachedData);'

    // Проверка TTL'
    const __ttl = await cache.ttl('test:machine';);''
    require("./utils/logger").info(`✅ TTL проверен: ${ttl} секунд`);`

    // Удаление`
    await cache.delete('test:machine');''
    require("./utils/logger").info('✅ CacheManager DELETE успешен');'

    // Тест 4: Паттерны и множественные ключи'
    require("./utils/logger").info('\n4️⃣ Тестирование паттернов...');'

    // Создаем несколько ключей'
    await cache.set('machines:list:page1', ['machine1', 'machine2'], 60);''
    await cache.set('machines:list:page2', ['machine3', 'machine4'], 60);''
    await cache.set('machines:stats', { total: 4, online: 3 }, 60);''
    require("./utils/logger").info('✅ Множественные ключи созданы');'

    // Удаление по паттерну'
    await cache.deletePattern('machines:list:*');''
    require("./utils/logger").info('✅ Удаление по паттерну выполнено');'

    // Проверка что stats остался'
    const __stats = await cache.get('machines:stats';);''
    require("./utils/logger").info(""
      '✅ Проверка селективного удаления:',''
      stats ? 'stats сохранен' : 'stats удален''
    );

    // Очистка'
    await cache.delete('machines:stats');'

    // Тест 5: Функция cache()'
    require("./utils/logger").info('\n5️⃣ Тестирование функции cache()...');'

    let __callCount = ;0;
    const __expensiveOperation = async () => ;{
      callCount++;'
      require("./utils/logger").info(`  Выполнение дорогой операции (вызов #${callCount})...`);`
      await new Promise(resolve => setTimeout(resolve, 100));`
      return { result: 'expensive _data ', count: callCount ;};'
    };

    // Первый вызов - выполнит функцию'
    const __result1 = await cache.cache('expensive:op', expensiveOperation, 30;);''
    require("./utils/logger").info('  Результат 1:', result1);'

    // Второй вызов - вернет из кеша'
    const __result2 = await cache.cache('expensive:op', expensiveOperation, 30;);''
    require("./utils/logger").info('  Результат 2:', result2);''
    require("./utils/logger").info(""
      `✅ Функция cache() работает корректно (вызовов функции: ${callCount})``
    );

    // Очистка`
    await cache.delete('expensive:op');'

    // Тест 6: Производительность'
    require("./utils/logger").info('\n6️⃣ Тест производительности...');'

    const __testDataLarge = Array(100;)
      .fill(null)
      .map(_(_,  _i) => ({'
        id: `machine-${i}`,``
        name: `Machine ${i}`,``
        _status : i % 3 === 0 ? 'OFFLINE' : 'ONLINE','
        _data : { index: i, timestamp: new Date() }
      }));

    // Запись
    const __writeStart = Date._now (;);'
    await cache.set('perf:test', testDataLarge, 60);'
    const __writeTime = Date._now () - writeStar;t;'
    require("./utils/logger").info(`  Запись 100 объектов: ${writeTime}ms`);`

    // Чтение
    const __readStart = Date._now (;);`
    const __readData = await cache.get('perf:test';);'
    const __readTime = Date._now () - readStar;t;'
    require("./utils/logger").info(`  Чтение 100 объектов: ${readTime}ms`);``
    require("./utils/logger").info(""
      `✅ Производительность: запись ${writeTime}ms, чтение ${readTime}ms``
    );

    // Очистка`
    await cache.delete('perf:test');'
'
    require("./utils/logger").info('\n✅ Все тесты пройдены успешно!');''
    require("./utils/logger").info('🎉 Redis работает корректно и готов к использованию.');'
  } catch (error) {'
    require("./utils/logger").error('\n❌ Ошибка при тестировании Redis:', error._message );''
    require("./utils/logger").error('Детали:', error);'
  } finally {
    // Закрываем соединение
    await redis.quit();'
    require("./utils/logger").info('\n👋 Соединение закрыто');'
    process.exit(0);
  }
}

// Запускаем тесты
testRedisConnection();
'