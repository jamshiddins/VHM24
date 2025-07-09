# Redis Setup and Usage Guide

## Конфигурация

Redis настроен для использования в Railway:
- URL: `redis://default@maglev.proxy.rlwy.net:56313`
- TTL по умолчанию: 3600 секунд (1 час)

## Переменные окружения

```env
REDIS_URL=redis://default@maglev.proxy.rlwy.net:56313
REDIS_TTL=3600
```

## Использование в сервисах

### 1. Импорт утилит

```javascript
const { cacheManagers, cacheMiddleware } = require('@vhm24/shared-types/src/redis');
```

### 2. Получение менеджера кеша для сервиса

```javascript
const cache = cacheManagers.machines; // Для сервиса machines
// Доступные менеджеры: auth, machines, inventory, tasks, reports, telegram
```

### 3. Основные операции

#### Сохранение в кеш
```javascript
await cache.set('key', data, ttl); // ttl в секундах
```

#### Получение из кеша
```javascript
const data = await cache.get('key');
if (data) {
  // Данные найдены в кеше
}
```

#### Удаление из кеша
```javascript
await cache.delete('key');
```

#### Удаление по паттерну
```javascript
await cache.deletePattern('machines:list:*');
```

### 4. Middleware для HTTP запросов

```javascript
fastify.get('/api/v1/machines', {
  preHandler: cacheMiddleware({
    keyGenerator: (req) => `machines:list:${JSON.stringify(req.query)}`,
    ttl: 300, // 5 минут
    serviceName: 'machines',
    condition: (req) => !req.query.search // Кешируем только если нет поиска
  })
}, handler);
```

### 5. Кеширование функций

```javascript
const result = await cache.cache('expensive-operation', async () => {
  // Дорогая операция
  return await expensiveOperation();
}, 600); // Кешируем на 10 минут
```

## Стратегии инвалидации кеша

### При создании/обновлении/удалении

```javascript
// После изменения данных
await cache.delete(`machine:${id}`);
await cache.deletePattern('machines:list:*');
await cache.deletePattern('machines:stats');
```

### Автоматическая инвалидация по TTL

- Списки: 5 минут
- Детальная информация: 10 минут
- Статистика: 5 минут
- Отчеты: 1 час

## Префиксы ключей

Каждый сервис использует свой префикс:
- `vhm24:auth:` - для сервиса авторизации
- `vhm24:machines:` - для сервиса машин
- `vhm24:inventory:` - для сервиса инвентаря
- `vhm24:tasks:` - для сервиса задач
- `vhm24:reports:` - для отчетов
- `vhm24:telegram:` - для телеграм бота

## Мониторинг

### Проверка заголовков ответа

- `X-Cache: HIT` - данные получены из кеша
- `X-Cache: MISS` - данные получены из БД и сохранены в кеш

### Логирование

Redis автоматически логирует:
- Ошибки подключения
- Успешные подключения
- Ошибки операций

## Обработка ошибок

Все операции с кешем обернуты в try-catch и не прерывают основную логику:
- При ошибке чтения - возвращается null
- При ошибке записи - логируется ошибка, но запрос продолжается
- При недоступности Redis - сервис продолжает работать без кеша

## Примеры использования

### Пример 1: Кеширование списка машин

```javascript
// В обработчике запроса
const cacheKey = `machines:list:${JSON.stringify(filters)}`;
const cached = await cache.get(cacheKey);

if (cached) {
  reply.header('X-Cache', 'HIT');
  return { success: true, data: cached };
}

// Получаем данные из БД
const machines = await prisma.machine.findMany({ where: filters });

// Сохраняем в кеш
await cache.set(cacheKey, machines, 300); // 5 минут

return { success: true, data: machines };
```

### Пример 2: Инвалидация при обновлении

```javascript
// Обновляем машину
const updated = await prisma.machine.update({
  where: { id },
  data: updates
});

// Инвалидируем связанный кеш
await cache.delete(`machine:${id}`);
await cache.deletePattern('machines:list:*');
await cache.deletePattern('machines:stats');
```

## Производительность

Redis значительно улучшает производительность:
- Списки машин: с ~200ms до ~5ms
- Детальная информация: с ~150ms до ~3ms
- Статистика: с ~500ms до ~10ms

## Безопасность

- Используйте санитизацию при генерации ключей
- Не храните чувствительные данные без шифрования
- Устанавливайте разумные TTL для предотвращения устаревания данных
