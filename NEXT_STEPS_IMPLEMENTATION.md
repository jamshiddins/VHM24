# План реализации следующих шагов по улучшению VHM24

## 1. Стандартизация кода

### 1.1. Стандартизация модульной системы (CommonJS)

**Задачи:**

- Создать скрипт для автоматической конвертации ES6 модулей в CommonJS
- Обновить ESLint конфигурацию для проверки соответствия CommonJS
- Обновить документацию по стилю кода

**Реализация:**

```javascript
// scripts/standardize-modules.js
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Находим все JS файлы в проекте
const jsFiles = glob.sync('**/*.js', {
  ignore: ['node_modules/**', 'dist/**', 'build/**']
});

// Конвертируем ES6 импорты/экспорты в CommonJS
jsFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Заменяем import на require
  content = content.replace(
    /import\s+(\{[^}]+\}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g,
    (match, imports, source) => {
      if (imports.startsWith('{') && imports.endsWith('}')) {
        // Деструктуризация: import { a, b } from 'module'
        const items = imports
          .slice(1, -1)
          .split(',')
          .map(item => item.trim());
        return `const { ${items.join(', ')} } = require('${source}')`;
      } else if (imports.startsWith('*')) {
        // Импорт всего модуля: import * as name from 'module'
        const name = imports.replace(/\*\s+as\s+/, '').trim();
        return `const ${name} = require('${source}')`;
      } else {
        // Простой импорт: import name from 'module'
        return `const ${imports} = require('${source}')`;
      }
    }
  );

  // Заменяем export default на module.exports
  content = content.replace(/export\s+default\s+(\w+)/g, 'module.exports = $1');

  // Заменяем именованные экспорты
  const namedExports = [];
  content = content.replace(
    /export\s+(const|let|var|function|class)\s+(\w+)/g,
    (match, type, name) => {
      namedExports.push(name);
      return `${type} ${name}`;
    }
  );

  // Добавляем module.exports для именованных экспортов
  if (namedExports.length > 0) {
    content += `\nmodule.exports = { ${namedExports.join(', ')} };\n`;
  }

  fs.writeFileSync(file, content);
  console.log(`✅ Стандартизирован файл: ${file}`);
});
```

### 1.2. Улучшение обработки асинхронных операций

**Задачи:**

- Заменить Promise.all на Promise.allSettled
- Добавить таймауты для внешних API вызовов
- Создать утилиты для упрощения работы с асинхронными операциями

**Реализация:**

```javascript
// packages/shared/utils/async.js
/**
 * Выполняет несколько промисов с обработкой ошибок
 * @param {Promise[]} promises - Массив промисов
 * @returns {Promise<{status: string, value?: any, reason?: any}[]>} Результаты выполнения
 */
async function safePromiseAll(promises) {
  return Promise.allSettled(promises);
}

/**
 * Добавляет таймаут к промису
 * @param {Promise} promise - Промис
 * @param {number} ms - Таймаут в миллисекундах
 * @param {string} errorMessage - Сообщение об ошибке
 * @returns {Promise} Промис с таймаутом
 */
function withTimeout(promise, ms = 5000, errorMessage = 'Operation timed out') {
  const timeout = new Promise((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error(errorMessage));
    }, ms);
  });

  return Promise.race([promise, timeout]);
}

/**
 * Выполняет функцию с повторными попытками
 * @param {Function} fn - Функция, возвращающая промис
 * @param {Object} options - Опции
 * @param {number} options.retries - Количество повторных попыток
 * @param {number} options.delay - Задержка между попытками в мс
 * @param {Function} options.onRetry - Функция, вызываемая при повторной попытке
 * @returns {Promise} Результат выполнения функции
 */
async function retry(fn, { retries = 3, delay = 1000, onRetry = () => {} } = {}) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < retries) {
        onRetry(error, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

module.exports = {
  safePromiseAll,
  withTimeout,
  retry
};
```

### 1.3. Вынесение общего кода в shared пакеты

**Задачи:**

- Идентифицировать повторяющийся код в разных сервисах
- Создать shared пакеты для общего кода
- Обновить импорты в сервисах

**Реализация:**

```javascript
// packages/shared/middleware/index.js
const auth = require('./auth');
const errorHandler = require('./errorHandler');
const validation = require('./validation');
const rateLimiter = require('./rateLimiter');
const cors = require('./cors');

module.exports = {
  auth,
  errorHandler,
  validation,
  rateLimiter,
  cors
};

// packages/shared/utils/index.js
const async = require('./async');
const config = require('./config');
const pagination = require('./pagination');
const security = require('./security');
const validation = require('./validation');

module.exports = {
  async,
  config,
  pagination,
  security,
  validation
};
```

## 2. Оптимизация производительности

### 2.1. Оптимизация запросов к БД

**Задачи:**

- Добавить пагинацию для всех запросов, возвращающих множество записей
- Создать индексы для часто используемых полей
- Оптимизировать N+1 запросы

**Реализация:**

```javascript
// packages/shared/utils/pagination.js
/**
 * Создает объект пагинации для Prisma
 * @param {Object} options - Опции пагинации
 * @param {number} options.page - Номер страницы (начиная с 1)
 * @param {number} options.pageSize - Размер страницы
 * @returns {Object} Объект пагинации для Prisma
 */
function createPagination({ page = 1, pageSize = 20 } = {}) {
  const skip = (page - 1) * pageSize;
  return {
    skip,
    take: pageSize
  };
}

/**
 * Форматирует результат запроса с пагинацией
 * @param {Array} items - Элементы текущей страницы
 * @param {number} total - Общее количество элементов
 * @param {Object} options - Опции пагинации
 * @param {number} options.page - Номер страницы (начиная с 1)
 * @param {number} options.pageSize - Размер страницы
 * @returns {Object} Отформатированный результат с метаданными пагинации
 */
function formatPaginatedResult(items, total, { page = 1, pageSize = 20 } = {}) {
  const totalPages = Math.ceil(total / pageSize);

  return {
    items,
    meta: {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
}

module.exports = {
  createPagination,
  formatPaginatedResult
};

// Пример использования в сервисе
async function getUsers(req, reply) {
  const { page = 1, pageSize = 20 } = req.query;

  const pagination = createPagination({ page, pageSize });

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      ...pagination,
      include: {
        profile: true // Избегаем N+1 запросы
      }
    }),
    prisma.user.count()
  ]);

  return formatPaginatedResult(users, total, { page, pageSize });
}
```

### 2.2. Добавление кэширования

**Задачи:**

- Настроить Redis для кэширования
- Создать middleware для кэширования ответов API
- Реализовать инвалидацию кэша при изменении данных

**Реализация:**

```javascript
// packages/shared/cache/index.js
const Redis = require('ioredis');
const { promisify } = require('util');

// Создаем подключение к Redis
const redis = new Redis(process.env.REDIS_URL);

// Время жизни кэша по умолчанию (1 час)
const DEFAULT_TTL = 3600;

/**
 * Получает данные из кэша
 * @param {string} key - Ключ кэша
 * @returns {Promise<any>} Данные из кэша или null, если кэш не найден
 */
async function get(key) {
  const data = await redis.get(key);
  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch (error) {
    return data;
  }
}

/**
 * Сохраняет данные в кэш
 * @param {string} key - Ключ кэша
 * @param {any} data - Данные для сохранения
 * @param {number} ttl - Время жизни кэша в секундах
 * @returns {Promise<boolean>} Результат операции
 */
async function set(key, data, ttl = DEFAULT_TTL) {
  const serialized = typeof data === 'string' ? data : JSON.stringify(data);
  return redis.set(key, serialized, 'EX', ttl);
}

/**
 * Удаляет данные из кэша
 * @param {string} key - Ключ кэша
 * @returns {Promise<boolean>} Результат операции
 */
async function del(key) {
  return redis.del(key);
}

/**
 * Удаляет данные из кэша по шаблону
 * @param {string} pattern - Шаблон ключа
 * @returns {Promise<number>} Количество удаленных ключей
 */
async function delByPattern(pattern) {
  const keys = await redis.keys(pattern);
  if (keys.length === 0) return 0;

  return redis.del(keys);
}

/**
 * Middleware для кэширования ответов API
 * @param {Object} options - Опции кэширования
 * @param {number} options.ttl - Время жизни кэша в секундах
 * @param {Function} options.keyGenerator - Функция для генерации ключа кэша
 * @returns {Function} Middleware функция
 */
function cacheMiddleware({ ttl = DEFAULT_TTL, keyGenerator = req => req.url } = {}) {
  return async (req, reply) => {
    // Пропускаем кэширование для не-GET запросов
    if (req.method !== 'GET') return;

    const cacheKey = `api:${keyGenerator(req)}`;
    const cachedData = await get(cacheKey);

    if (cachedData) {
      return reply.send(cachedData);
    }

    // Сохраняем оригинальный метод send
    const originalSend = reply.send;

    // Переопределяем метод send для сохранения ответа в кэш
    reply.send = function (payload) {
      set(cacheKey, payload, ttl);
      return originalSend.call(this, payload);
    };
  };
}

module.exports = {
  redis,
  get,
  set,
  del,
  delByPattern,
  cacheMiddleware
};
```

## 3. Мониторинг и логирование

### 3.1. Настройка Prometheus и Grafana

**Задачи:**

- Настроить сбор метрик с помощью Prometheus
- Создать Grafana дашборды для визуализации метрик
- Настроить алерты для критических ситуаций

**Реализация:**

```javascript
// packages/shared/monitoring/prometheus.js
const client = require('prom-client');
const fastifyPlugin = require('fastify-plugin');

// Создаем реестр метрик
const register = new client.Registry();

// Добавляем стандартные метрики
client.collectDefaultMetrics({ register });

// Создаем метрики
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const errorCounter = new client.Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['service', 'type']
});

// Регистрируем метрики
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestCounter);
register.registerMetric(errorCounter);

// Создаем Fastify плагин
function prometheusPlugin(fastify, options, done) {
  // Добавляем маршрут для метрик
  fastify.get('/metrics', async (request, reply) => {
    reply.header('Content-Type', register.contentType);
    return register.metrics();
  });

  // Добавляем хук для измерения длительности запросов
  fastify.addHook('onRequest', (request, reply, done) => {
    request.metrics = {
      startTime: process.hrtime()
    };
    done();
  });

  fastify.addHook('onResponse', (request, reply, done) => {
    const { startTime } = request.metrics;
    const duration = process.hrtime(startTime);
    const durationInSeconds = duration[0] + duration[1] / 1e9;

    const route = request.routerPath || request.url;

    httpRequestDurationMicroseconds
      .labels(request.method, route, reply.statusCode)
      .observe(durationInSeconds);

    httpRequestCounter.labels(request.method, route, reply.statusCode).inc();

    done();
  });

  // Добавляем метод для инкремента счетчика ошибок
  fastify.decorate('incrementErrorCounter', type => {
    errorCounter.labels(options.serviceName || 'unknown', type).inc();
  });

  done();
}

module.exports = {
  register,
  prometheusPlugin: fastifyPlugin(prometheusPlugin),
  httpRequestDurationMicroseconds,
  httpRequestCounter,
  errorCounter
};
```

### 3.2. Улучшение логирования

**Задачи:**

- Заменить оставшиеся console.log на структурированное логирование
- Добавить контекстную информацию в логи
- Настроить ротацию логов

**Реализация:**

```javascript
// packages/shared/logger/index.js
const pino = require('pino');
const fastifyPlugin = require('fastify-plugin');

// Создаем транспорт для логов
const transport = pino.transport({
  targets: [
    // Консольный вывод для разработки
    {
      target: 'pino-pretty',
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname'
      }
    },
    // Файловый вывод для production
    {
      target: 'pino/file',
      level: 'info',
      options: {
        destination: `./logs/${process.env.SERVICE_NAME || 'app'}.log`,
        mkdir: true
      }
    }
  ]
});

// Создаем логгер
const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
    base: {
      service: process.env.SERVICE_NAME || 'unknown',
      env: process.env.NODE_ENV || 'development'
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: ['password', 'token', 'secret', 'authorization', 'cookie'],
      censor: '[REDACTED]'
    }
  },
  transport
);

// Создаем Fastify плагин
function loggerPlugin(fastify, options, done) {
  // Добавляем логгер в Fastify
  fastify.decorate('logger', logger);

  // Добавляем хук для логирования запросов
  fastify.addHook('onRequest', (request, reply, done) => {
    request.log.info(
      {
        req: {
          method: request.method,
          url: request.url,
          headers: request.headers,
          remoteAddress: request.ip,
          remotePort: request.socket.remotePort
        }
      },
      'Incoming request'
    );

    done();
  });

  // Добавляем хук для логирования ответов
  fastify.addHook('onResponse', (request, reply, done) => {
    request.log.info(
      {
        res: {
          statusCode: reply.statusCode,
          responseTime: reply.getResponseTime()
        }
      },
      'Request completed'
    );

    done();
  });

  // Добавляем хук для логирования ошибок
  fastify.addHook('onError', (request, reply, error, done) => {
    request.log.error(
      {
        err: {
          message: error.message,
          stack: error.stack,
          code: error.code,
          statusCode: error.statusCode || 500
        },
        req: {
          method: request.method,
          url: request.url,
          headers: request.headers,
          params: request.params,
          query: request.query,
          body: request.body
        }
      },
      'Request error'
    );

    done();
  });

  done();
}

module.exports = {
  logger,
  loggerPlugin: fastifyPlugin(loggerPlugin)
};
```

## 4. CI/CD и тестирование

### 4.1. Настройка автоматического деплоя

**Задачи:**

- Настроить автоматический деплой на staging и production
- Добавить проверки перед деплоем
- Настроить откат при ошибках

**Реализация:**

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches:
      - main
      - staging

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test

  security-scan:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run security scan
        run: npm audit --production

  deploy-staging:
    runs-on: ubuntu-latest
    needs: [test, security-scan]
    if: github.ref == 'refs/heads/staging'
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install Railway CLI
        run: npm i -g @railway/cli
      - name: Deploy to Railway (Staging)
        run: railway up --environment staging
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN_STAGING }}

  deploy-production:
    runs-on: ubuntu-latest
    needs: [test, security-scan]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install Railway CLI
        run: npm i -g @railway/cli
      - name: Deploy to Railway (Production)
        run: railway up --environment production
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN_PRODUCTION }}
```

### 4.2. Улучшение тестирования

**Задачи:**

- Добавить unit тесты для критических компонентов
- Создать интеграционные тесты для проверки взаимодействия сервисов
- Добавить end-to-end тесты для проверки пользовательских сценариев

**Реализация:**

```javascript
// tests/unit/shared/utils/async.test.js
const { safePromiseAll, withTimeout, retry } = require('../../../../packages/shared/utils/async');

describe('Async Utils', () => {
  describe('safePromiseAll', () => {
    it('should resolve all promises', async () => {
      const promises = [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)];

      const results = await safePromiseAll(promises);

      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({ status: 'fulfilled', value: 1 });
      expect(results[1]).toEqual({ status: 'fulfilled', value: 2 });
      expect(results[2]).toEqual({ status: 'fulfilled', value: 3 });
    });

    it('should handle rejected promises', async () => {
      const promises = [
        Promise.resolve(1),
        Promise.reject(new Error('Test error')),
        Promise.resolve(3)
      ];

      const results = await safePromiseAll(promises);

      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({ status: 'fulfilled', value: 1 });
      expect(results[1]).toEqual({ status: 'rejected', reason: expect.any(Error) });
      expect(results[2]).toEqual({ status: 'fulfilled', value: 3 });
    });
  });

  describe('withTimeout', () => {
    it('should resolve if promise resolves before timeout', async () => {
      const promise = Promise.resolve('success');
      const result = await withTimeout(promise, 1000);

      expect(result).toBe('success');
    });

    it('should reject if promise takes too long', async () => {
      const promise = new Promise(resolve => setTimeout(() => resolve('success'), 200));

      await expect(withTimeout(promise, 100)).rejects.toThrow('Operation timed out');
    });
  });

  describe('retry', () => {
    it('should resolve if function succeeds on first try', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await retry(fn, { retries: 3 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry if function fails', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');

      const result = await retry(fn, { retries: 3, delay: 10 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should reject if all retries fail', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Test error'));

      await expect(retry(fn, { retries: 2, delay: 10 })).rejects.toThrow('Test error');
      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });
});
```

## 5. Дорожная карта внедрения

### Фаза 1: Критические улучшения (1-2 недели)

- Завершить исправление проблем безопасности
- Стандартизировать модульную систему
- Добавить базовое кэширование
- Улучшить обработку ошибок

### Фаза 2: Производительность и мониторинг (2-3 недели)

- Оптимизировать запросы к БД
- Настроить Prometheus и Grafana
- Улучшить логирование
- Добавить алерты

### Фаза 3: Тестирование и CI/CD (2-3 недели)

- Добавить unit и интеграционные тесты
- Настроить автоматический деплой
- Добавить статический анализ кода
- Настроить мониторинг производительности

### Фаза 4: Масштабирование и документация (2-3 недели)

- Улучшить масштабируемость сервисов
- Создать полную документацию API
- Добавить автоматическое резервное копирование
- Провести нагрузочное тестирование
