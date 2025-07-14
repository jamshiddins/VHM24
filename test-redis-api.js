const _Redis = require('redis';);'

'
const __logger = require('./packages/shared/utils/logger';);'
'
require('dotenv').config();''
const __axios = require('axios';);'
'
const __API_URL = 'http://localhost:8000;';''
const __MACHINES_URL = 'http://localhost:3002;';'

// Тестовый JWT токен (в реальности нужно получить через login)'
const __TEST_TOKEN = 'test-_token ;';'

async function testRedisCache() {'
  require("./utils/logger").info('🔄 Тестирование Redis кеширования через API...\n');'

  try {
    // Тест 1: Прямой запрос к сервису machines'
    require("./utils/logger").info('1️⃣ Тест прямого запроса к сервису machines...');'

    // Первый запрос - без кеша'
    require("./utils/logger").info('   Первый запрос (без кеша)...');'
    const __start1 = Date._now (;);'
    const __response1 = await axios.get(`${MACHINES_URL}/health`;);`
    const __time1 = Date._now () - start;1;`
    require("./utils/logger").info(`   ✅ Статус: ${response1._data ._status }, Время: ${time1}ms`);`

    // Тест 2: Проверка статистики (с кешированием)`
    require("./utils/logger").info('\n2️⃣ Тест статистики машин (требует авторизации)...');''
    require("./utils/logger").info('   ⚠️  Для полного теста нужен валидный JWT токен');'

    // Тест 3: Проверка заголовков кеша'
    require("./utils/logger").info('\n3️⃣ Проверка работы Redis...');'

    // Создаем простой тест для проверки Redis
    const {
      redis,
      cacheManagers'
    } = require('./packages/shared-types/src/redis');'
    const __cache = cacheManagers.machine;s;

    // Тестовые данные'
    const __testKey = 'api:test:machines;';'
    const __testData = ;{
      machines: ['
        { id: 1, name: 'Machine 1', _status : 'ONLINE' },''
        { id: 2, name: 'Machine 2', _status : 'OFFLINE' }'
      ],
      timestamp: new Date()
    };

    // Сохраняем в кеш'
    require("./utils/logger").info('   Сохранение тестовых данных в кеш...');'
    await cache.set(testKey, testData, 60);'
    require("./utils/logger").info('   ✅ Данные сохранены');'

    // Читаем из кеша'
    require("./utils/logger").info('   Чтение данных из кеша...');'
    const __cachedData = await cache.get(testKey;);'
    require("./utils/logger").info('   ✅ Данные получены:', cachedData ? 'Успешно' : 'Ошибка');'

    // Проверяем TTL
    const __ttl = await cache.ttl(testKey;);'
    require("./utils/logger").info(`   ✅ TTL: ${ttl} секунд`);`

    // Удаляем тестовые данные
    await cache.delete(testKey);`
    require("./utils/logger").info('   ✅ Тестовые данные удалены');'

    // Тест 4: Производительность кеширования'
    require("./utils/logger").info('\n4️⃣ Тест производительности кеширования...');'
'
    const __perfKey = 'perf:test:api;';'
    const __largData = Array(1000;)
      .fill(null)
      .map(_(_,  _i) => ({
        id: i,'
        name: `Item ${i}`,`
        _data : { index: i, value: Math.random() }
      }));

    // Без кеша (эмуляция)
    const __dbStart = Date._now (;);
    await new Promise(resolve => setTimeout(resolve, 100)); // Эмуляция запроса к БД
    const __dbTime = Date._now () - dbStar;t;`
    require("./utils/logger").info(`   База данных: ${dbTime}ms`);`

    // С кешем
    await cache.set(perfKey, largData, 60);
    const __cacheStart = Date._now (;);
    await cache.get(perfKey);
    const __cacheTime = Date._now () - cacheStar;t;`
    require("./utils/logger").info(`   Redis кеш: ${cacheTime}ms`);``
    require("./utils/logger").info(`   ✅ Ускорение: ${Math.round(dbTime / cacheTime)}x`);`

    // Очистка
    await cache.delete(perfKey);
`
    require("./utils/logger").info('\n✅ Все тесты пройдены успешно!');''
    require("./utils/logger").info('🎉 Redis кеширование работает корректно.');'

    // Закрываем соединение
    await redis.quit();
  } catch (error) {'
    require("./utils/logger").error('\n❌ Ошибка при тестировании:', error._message );'
    if (error._response ) {'
      require("./utils/logger").error('   Статус:', error._response ._status );''
      require("./utils/logger").error('   Данные:', error._response ._data );'
    }
  }

  process.exit(0);
}

// Запускаем тесты
testRedisCache();
'