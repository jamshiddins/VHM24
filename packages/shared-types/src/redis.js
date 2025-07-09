const Redis = require('ioredis');

// Создаем подключение к Redis
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      // Переподключаемся при ошибке READONLY
      return true;
    }
    return false;
  }
});

// Обработка ошибок подключения
redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

// Утилиты для работы с кешем
class CacheManager {
  constructor(prefix = 'vhm24:') {
    this.prefix = prefix;
    this.defaultTTL = parseInt(process.env.REDIS_TTL) || 3600; // 1 час по умолчанию
  }

  // Генерация ключа с префиксом
  getKey(key) {
    return `${this.prefix}${key}`;
  }

  // Получение данных из кеша
  async get(key) {
    try {
      const data = await redis.get(this.getKey(key));
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  // Сохранение данных в кеш
  async set(key, value, ttl = this.defaultTTL) {
    try {
      const data = JSON.stringify(value);
      if (ttl) {
        await redis.setex(this.getKey(key), ttl, data);
      } else {
        await redis.set(this.getKey(key), data);
      }
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  // Удаление данных из кеша
  async delete(key) {
    try {
      await redis.del(this.getKey(key));
      return true;
    } catch (error) {
      console.error('Redis delete error:', error);
      return false;
    }
  }

  // Удаление данных по паттерну
  async deletePattern(pattern) {
    try {
      const keys = await redis.keys(this.getKey(pattern));
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Redis delete pattern error:', error);
      return false;
    }
  }

  // Проверка существования ключа
  async exists(key) {
    try {
      const exists = await redis.exists(this.getKey(key));
      return exists === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  // Установка времени жизни для существующего ключа
  async expire(key, ttl) {
    try {
      await redis.expire(this.getKey(key), ttl);
      return true;
    } catch (error) {
      console.error('Redis expire error:', error);
      return false;
    }
  }

  // Получение оставшегося времени жизни ключа
  async ttl(key) {
    try {
      const ttl = await redis.ttl(this.getKey(key));
      return ttl;
    } catch (error) {
      console.error('Redis ttl error:', error);
      return -1;
    }
  }

  // Очистка всего кеша с префиксом
  async flush() {
    try {
      const keys = await redis.keys(this.getKey('*'));
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Redis flush error:', error);
      return false;
    }
  }

  // Кеширование результата функции
  async cache(key, fn, ttl = this.defaultTTL) {
    // Проверяем кеш
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Выполняем функцию
    const result = await fn();

    // Сохраняем результат в кеш
    await this.set(key, result, ttl);

    return result;
  }

  // Инвалидация кеша для связанных сущностей
  async invalidate(patterns) {
    try {
      const promises = patterns.map(pattern => this.deletePattern(pattern));
      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('Redis invalidate error:', error);
      return false;
    }
  }
}

// Создаем экземпляры для разных сервисов
const cacheManagers = {
  auth: new CacheManager('vhm24:auth:'),
  machines: new CacheManager('vhm24:machines:'),
  inventory: new CacheManager('vhm24:inventory:'),
  tasks: new CacheManager('vhm24:tasks:'),
  reports: new CacheManager('vhm24:reports:'),
  telegram: new CacheManager('vhm24:telegram:')
};

// Декоратор для кеширования методов
function cacheable(keyGenerator, ttl) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args) {
      const cache = cacheManagers[this.serviceName] || new CacheManager();
      const key = typeof keyGenerator === 'function' 
        ? keyGenerator.apply(this, args) 
        : keyGenerator;

      return cache.cache(key, async () => {
        return originalMethod.apply(this, args);
      }, ttl);
    };

    return descriptor;
  };
}

// Middleware для кеширования HTTP запросов
function cacheMiddleware(options = {}) {
  const {
    keyGenerator = (req) => `${req.method}:${req.url}`,
    ttl = 300, // 5 минут по умолчанию
    serviceName = 'http',
    condition = () => true
  } = options;

  const cache = cacheManagers[serviceName] || new CacheManager(`vhm24:${serviceName}:`);

  return async (req, reply) => {
    // Проверяем условие кеширования
    if (!condition(req)) {
      return;
    }

    const key = keyGenerator(req);

    // Проверяем кеш для GET запросов
    if (req.method === 'GET') {
      const cached = await cache.get(key);
      if (cached) {
        reply.header('X-Cache', 'HIT');
        return reply.send(cached);
      }
    }

    // Перехватываем ответ для кеширования
    const originalSend = reply.send.bind(reply);
    reply.send = function(payload) {
      // Кешируем успешные ответы
      if (reply.statusCode >= 200 && reply.statusCode < 300) {
        cache.set(key, payload, ttl).catch(err => {
          console.error('Cache set error:', err);
        });
      }
      reply.header('X-Cache', 'MISS');
      return originalSend(payload);
    };
  };
}

module.exports = {
  redis,
  CacheManager,
  cacheManagers,
  cacheable,
  cacheMiddleware
};
