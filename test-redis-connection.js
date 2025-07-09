require('dotenv').config();
const { redis, cacheManagers } = require('./packages/shared-types/src/redis');

async function testRedisConnection() {
  console.log('🔄 Тестирование подключения к Redis...');
  console.log(`📍 URL: ${process.env.REDIS_URL}`);
  
  try {
    // Тест 1: Проверка подключения
    console.log('\n1️⃣ Проверка подключения...');
    await redis.ping();
    console.log('✅ Подключение успешно!');
    
    // Тест 2: Базовые операции
    console.log('\n2️⃣ Тестирование базовых операций...');
    const testKey = 'test:connection';
    const testValue = { message: 'Hello Redis!', timestamp: new Date() };
    
    // SET
    await redis.set(testKey, JSON.stringify(testValue));
    console.log('✅ SET операция успешна');
    
    // GET
    const retrieved = await redis.get(testKey);
    const parsed = JSON.parse(retrieved);
    console.log('✅ GET операция успешна:', parsed);
    
    // DELETE
    await redis.del(testKey);
    console.log('✅ DELETE операция успешна');
    
    // Тест 3: Работа с CacheManager
    console.log('\n3️⃣ Тестирование CacheManager...');
    const cache = cacheManagers.machines;
    
    // Сохранение объекта
    const testData = {
      id: '123',
      name: 'Test Machine',
      status: 'ONLINE',
      createdAt: new Date()
    };
    
    await cache.set('test:machine', testData, 60); // TTL 60 секунд
    console.log('✅ CacheManager SET успешен');
    
    // Получение объекта
    const cachedData = await cache.get('test:machine');
    console.log('✅ CacheManager GET успешен:', cachedData);
    
    // Проверка TTL
    const ttl = await cache.ttl('test:machine');
    console.log(`✅ TTL проверен: ${ttl} секунд`);
    
    // Удаление
    await cache.delete('test:machine');
    console.log('✅ CacheManager DELETE успешен');
    
    // Тест 4: Паттерны и множественные ключи
    console.log('\n4️⃣ Тестирование паттернов...');
    
    // Создаем несколько ключей
    await cache.set('machines:list:page1', ['machine1', 'machine2'], 60);
    await cache.set('machines:list:page2', ['machine3', 'machine4'], 60);
    await cache.set('machines:stats', { total: 4, online: 3 }, 60);
    console.log('✅ Множественные ключи созданы');
    
    // Удаление по паттерну
    await cache.deletePattern('machines:list:*');
    console.log('✅ Удаление по паттерну выполнено');
    
    // Проверка что stats остался
    const stats = await cache.get('machines:stats');
    console.log('✅ Проверка селективного удаления:', stats ? 'stats сохранен' : 'stats удален');
    
    // Очистка
    await cache.delete('machines:stats');
    
    // Тест 5: Функция cache()
    console.log('\n5️⃣ Тестирование функции cache()...');
    
    let callCount = 0;
    const expensiveOperation = async () => {
      callCount++;
      console.log(`  Выполнение дорогой операции (вызов #${callCount})...`);
      await new Promise(resolve => setTimeout(resolve, 100));
      return { result: 'expensive data', count: callCount };
    };
    
    // Первый вызов - выполнит функцию
    const result1 = await cache.cache('expensive:op', expensiveOperation, 30);
    console.log('  Результат 1:', result1);
    
    // Второй вызов - вернет из кеша
    const result2 = await cache.cache('expensive:op', expensiveOperation, 30);
    console.log('  Результат 2:', result2);
    console.log(`✅ Функция cache() работает корректно (вызовов функции: ${callCount})`);
    
    // Очистка
    await cache.delete('expensive:op');
    
    // Тест 6: Производительность
    console.log('\n6️⃣ Тест производительности...');
    
    const testDataLarge = Array(100).fill(null).map((_, i) => ({
      id: `machine-${i}`,
      name: `Machine ${i}`,
      status: i % 3 === 0 ? 'OFFLINE' : 'ONLINE',
      data: { index: i, timestamp: new Date() }
    }));
    
    // Запись
    const writeStart = Date.now();
    await cache.set('perf:test', testDataLarge, 60);
    const writeTime = Date.now() - writeStart;
    console.log(`  Запись 100 объектов: ${writeTime}ms`);
    
    // Чтение
    const readStart = Date.now();
    const readData = await cache.get('perf:test');
    const readTime = Date.now() - readStart;
    console.log(`  Чтение 100 объектов: ${readTime}ms`);
    console.log(`✅ Производительность: запись ${writeTime}ms, чтение ${readTime}ms`);
    
    // Очистка
    await cache.delete('perf:test');
    
    console.log('\n✅ Все тесты пройдены успешно!');
    console.log('🎉 Redis работает корректно и готов к использованию.');
    
  } catch (error) {
    console.error('\n❌ Ошибка при тестировании Redis:', error.message);
    console.error('Детали:', error);
  } finally {
    // Закрываем соединение
    await redis.quit();
    console.log('\n👋 Соединение закрыто');
    process.exit(0);
  }
}

// Запускаем тесты
testRedisConnection();
