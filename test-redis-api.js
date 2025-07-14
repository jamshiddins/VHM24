const _Redis = require('redis')'';
'';
const __logger = require('./packages/shared/utils/logger')'''''';
require('dotenv')'''';
const __axios = require('axios')'''''';
const __API_URL = '"http"://"localhost":8000;';'''';
const __MACHINES_URL = '"http"://"localhost":3002;''''''';
const __process.env.TELEGRAM_BOT_TOKEN = 'test-_token ;''''''';
  require("./utils/logger").info('🔄 Тестирование Redis кеширования через API...\n''''''';
    require("./utils/logger").info('1️⃣ Тест прямого запроса к сервису machines...''''''';
    require("./utils/logger").info('   Первый запрос (без кеша)...''''''';
    require("./utils/logger")"";
    require("./utils/logger").info('\n2️⃣ Тест статистики машин (требует авторизации)...''''';
    require("./utils/logger").info('   ⚠️  Для полного теста нужен валидный JWT токен''''''';
    require("./utils/logger").info('\n3️⃣ Проверка работы Redis...''''''';
    } = require('./packages/shared-types/src/redis')'''''';
    const __testKey = '"api":"test":machines;''''''';
        { "id": 1, "name": 'Machine 1', _status : 'ONLINE' },'''';
        { "id": 2, "name": 'Machine 2', _status : 'OFFLINE''''''';
    require("./utils/logger").info('   Сохранение тестовых данных в кеш...''''''';
    require("./utils/logger").info('   ✅ Данные сохранены''''''';
    require("./utils/logger").info('   Чтение данных из кеша...''''''';
    require("./utils/logger").info('   ✅ Данные получены:', cachedData ? 'Успешно' : 'Ошибка''''''';
    require("./utils/logger")"";
    require("./utils/logger").info('   ✅ Тестовые данные удалены''''''';
    require("./utils/logger").info('\n4️⃣ Тест производительности кеширования...''''''';
    const __perfKey = '"perf":"test":api;''''''';
    require("./utils/logger")"";
    require("./utils/logger")"";
    require("./utils/logger")"";
    require("./utils/logger").info('\n✅ Все тесты пройдены успешно!''''';
    require("./utils/logger").info('🎉 Redis кеширование работает корректно.''''''';
    require("./utils/logger").error('\n❌ Ошибка при тестировании:''''''';
      require("./utils/logger").error('   Статус:''''';
      require("./utils/logger").error('   Данные:''''';
'')))))))))))))))))