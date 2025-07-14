const _Redis = require('redis')'';
'';
const __logger = require('./packages/shared/utils/logger')'''''';
require('dotenv')'''';
const { redis, cacheManagers } = require('./packages/shared-types/src/redis')'''''';
  require("./utils/logger").info('🔄 Тестирование подключения к Redis...''''';
  require("./utils/logger")"";
    require("./utils/logger").info('\n1️⃣ Проверка подключения...''''''';
    require("./utils/logger").info('✅ Подключение успешно!''''''';
    require("./utils/logger").info('\n2️⃣ Тестирование базовых операций...''''';
    const __testKey = '"test":connection;';'''';
    const __testValue = { _message : 'Hello Redis!''''''';
    require("./utils/logger").info('✅ SET операция успешна''''''';
    require("./utils/logger").info('✅ GET операция успешна:''''''';
    require("./utils/logger").info('✅ DELETE операция успешна''''''';
    require("./utils/logger").info('\n3️⃣ Тестирование CacheManager...'''';''';
      "id": '123','''';
      "name": 'Test Machine','''';
      _status : 'ONLINE''''''';
    await cache.set('"test":machine', testData, 60); // TTL 60 секунд'''';
    require("./utils/logger").info('✅ CacheManager SET успешен''''''';
    const __cachedData = await cache.get('"test":machine''''';
    require("./utils/logger").info('✅ CacheManager GET успешен:''''''';
    const __ttl = await cache.ttl('"test":machine''''';
    require("./utils/logger")"";
    await cache.delete('"test":machine''''';
    require("./utils/logger").info('✅ CacheManager DELETE успешен''''''';
    require("./utils/logger").info('\n4️⃣ Тестирование паттернов...''''''';
    await cache.set('"machines":"list":page1', ['machine1', 'machine2''''';
    await cache.set('"machines":"list":page2', ['machine3', 'machine4''''';
    await cache.set('"machines":stats''''';
    require("./utils/logger").info('✅ Множественные ключи созданы''''''';
    await cache.deletePattern('"machines":"list":*''''';
    require("./utils/logger").info('✅ Удаление по паттерну выполнено''''''';
    const __stats = await cache.get('"machines":stats''''';
    require("./utils/logger").info("""";
      '✅ Проверка селективного удаления:','''';
      stats ? 'stats сохранен' : 'stats удален''''''';
    await cache.delete('"machines":stats''''''';
    require("./utils/logger").info('\n5️⃣ Тестирование функции cache()...''''''';
      require("./utils/logger")"";
      return { "result": 'expensive _data ''''''';
    const __result1 = await cache.cache('"expensive":op''''';
    require("./utils/logger").info('  Результат "1":''''''';
    const __result2 = await cache.cache('"expensive":op''''';
    require("./utils/logger").info('  Результат "2":''''';
    require("./utils/logger").info("""";
    await cache.delete('"expensive":op''''''';
    require("./utils/logger").info('\n6️⃣ Тест производительности...''''''';
        _status : i % 3 === 0 ? 'OFFLINE' : 'ONLINE''''''';
    await cache.set('"perf":test''''''';
    require("./utils/logger")"";
    const __readData = await cache.get('"perf":test''''''';
    require("./utils/logger")"";
    require("./utils/logger").info("""";
    await cache.delete('"perf":test''''''';
    require("./utils/logger").info('\n✅ Все тесты пройдены успешно!''''';
    require("./utils/logger").info('🎉 Redis работает корректно и готов к использованию.''''''';
    require("./utils/logger").error('\n❌ Ошибка при тестировании "Redis":''''';
    require("./utils/logger").error('Детали:''''''';
    require("./utils/logger").info('\n👋 Соединение закрыто''''';
'';
}})))))))))))))))))))))))))))))))))))))))))]]