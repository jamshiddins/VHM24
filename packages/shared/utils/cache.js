/**
 * VHM24 Cache Utility
 * Redis кеширование с автоматической сериализацией
 */

const Redis = require('ioredis');
const { logger, structuredLog } = require('./logger');

/**
 * Создание Redis клиента
 */
const createRedisClient = () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  const redis = new Redis(redisUrl, {
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    
    // Настройки для production
    ...(process.env.NODE_ENV === 'production' && {
      connectTimeout: 10000,
      commandTimeout: 5000,
      retryDelayOnFailover: 100,
      enableOfflineQueue: false
    })
  });

  // Обработка событий Redis
  redis.on('connect', () => {
    logger.info('Redis connected');
  });

  redis.on('ready', () => {
    logger.info('Redis ready');
  });

  redis.on('error', (error) => {
    logger.error('Redis error:', error);
  });

  redis.on('close', () => {
    logger.warn('Redis connection closed');
  });

  redis.on('reconnecting', () => {
    logger.info('Redis reconnecting...');
  });

  return redis;
};

// Создаем основной Redis клиент
const redis = createRedisClient();

/**
 * Базовый класс для кеширования
 */
class Cache {
  constructor(prefix = 'vhm24', defaultTTL = 300) {
    this.prefix = prefix;
    this.defaultTTL = defaultTTL;
    this.redis = redis;
  }

  /**
   * Создание ключа с префиксом
   */
  _createKey(key) {
    return `${this.prefix}:${key}`;
  }

  /**
   * Получение данных из кеша
   */
  async get(key) {
    try {
      const cacheKey = this._createKey(key);
      const data = await this.redis.get(cacheKey);
      
      if (data) {
        structuredLog.cache.hit(key);
        return JSON.parse(data);
      } else {
        structuredLog.cache.miss(key);
        return null;
      }
    } catch (error) {
      logger.error('Cache get error:', { key, error: error.message });
      return null; // Возвращаем null при ошибке, чтобы не ломать приложение
    }
  }

  /**
   * Сохранение данных в кеш
   */
  async set(key, value, ttl = this.defaultTTL) {
    try {
      const cacheKey = this._createKey(key);
      const serializedValue = JSON.stringify(value);
      
      if (ttl > 0) {
        await this.redis.setex(cacheKey, ttl, serializedValue);
      } else {
        await this.redis.set(cacheKey, serializedValue);
      }
      
      structuredLog.cache.set(key, ttl);
      return true;
    } catch (error) {
      logger.error('Cache set error:', { key, ttl, error: error.message });
      return false;
    }
  }

  /**
   * Удаление данных из кеша
   */
  async del(key) {
    try {
      const cacheKey = this._createKey(key);
      const result = await this.redis.del(cacheKey);
      logger.debug('Cache delete:', { key, deleted: result > 0 });
      return result > 0;
    } catch (error) {
      logger.error('Cache delete error:', { key, error: error.message });
      return false;
    }
  }

  /**
   * Удаление по паттерну
   */
  async delPattern(pattern) {
    try {
      const cachePattern = this._createKey(pattern);
      const keys = await this.redis.keys(cachePattern);
      
      if (keys.length > 0) {
        const result = await this.redis.del(...keys);
        logger.debug('Cache pattern delete:', { pattern, deletedCount: result });
        return result;
      }
      
      return 0;
    } catch (error) {
      logger.error('Cache pattern delete error:', { pattern, error: error.message });
      return 0;
    }
  }

  /**
   * Проверка существования ключа
   */
  async exists(key) {
    try {
      const cacheKey = this._createKey(key);
      const result = await this.redis.exists(cacheKey);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', { key, error: error.message });
      return false;
    }
  }

  /**
   * Установка TTL для существующего ключа
   */
  async expire(key, ttl) {
    try {
      const cacheKey = this._createKey(key);
      const result = await this.redis.expire(cacheKey, ttl);
      return result === 1;
    } catch (error) {
      logger.error('Cache expire error:', { key, ttl, error: error.message });
      return false;
    }
  }

  /**
   * Получение TTL ключа
   */
  async ttl(key) {
    try {
      const cacheKey = this._createKey(key);
      return await this.redis.ttl(cacheKey);
    } catch (error) {
      logger.error('Cache TTL error:', { key, error: error.message });
      return -1;
    }
  }

  /**
   * Инкремент значения
   */
  async incr(key, amount = 1) {
    try {
      const cacheKey = this._createKey(key);
      return await this.redis.incrby(cacheKey, amount);
    } catch (error) {
      logger.error('Cache increment error:', { key, amount, error: error.message });
      return null;
    }
  }

  /**
   * Декремент значения
   */
  async decr(key, amount = 1) {
    try {
      const cacheKey = this._createKey(key);
      return await this.redis.decrby(cacheKey, amount);
    } catch (error) {
      logger.error('Cache decrement error:', { key, amount, error: error.message });
      return null;
    }
  }
}

/**
 * Создание экземпляров кеша для разных целей
 */
const cache = new Cache('vhm24', 300); // Основной кеш, 5 минут
const sessionCache = new Cache('session', 3600); // Сессии, 1 час
const rateLimit = new Cache('rate_limit', 60); // Rate limiting, 1 минута
const tempCache = new Cache('temp', 30); // Временный кеш, 30 секунд

/**
 * Декоратор для кеширования результатов функций
 */
const cacheResult = (keyGenerator, ttl = 300, cacheInstance = cache) => {
  return (target, propertyName, descriptor) => {
    const method = descriptor.value;
    
    descriptor.value = async function (...args) {
      const cacheKey = typeof keyGenerator === 'function' 
        ? keyGenerator(...args) 
        : `${propertyName}:${JSON.stringify(args)}`;
      
      // Пытаемся получить из кеша
      const cached = await cacheInstance.get(cacheKey);
      if (cached !== null) {
        return cached;
      }
      
      // Выполняем функцию и кешируем результат
      const result = await method.apply(this, args);
      await cacheInstance.set(cacheKey, result, ttl);
      
      return result;
    };
    
    return descriptor;
  };
};

/**
 * Middleware для кеширования HTTP ответов
 */
const cacheMiddleware = (keyGenerator, ttl = 300) => {
  return async (request, reply) => {
    const cacheKey = typeof keyGenerator === 'function'
      ? keyGenerator(request)
      : `http:${request.method}:${request.url}`;
    
    // Проверяем кеш только для GET запросов
    if (request.method === 'GET') {
      const cached = await cache.get(cacheKey);
      if (cached) {
        reply.header('X-Cache', 'HIT');
        return reply.send(cached);
      }
    }
    
    // Перехватываем ответ для кеширования
    const originalSend = reply.send;
    reply.send = function (payload) {
      if (request.method === 'GET' && reply.statusCode === 200) {
        cache.set(cacheKey, payload, ttl);
        reply.header('X-Cache', 'MISS');
      }
      return originalSend.call(this, payload);
    };
  };
};

/**
 * Утилиты для работы с кешем
 */
const cacheUtils = {
  /**
   * Очистка кеша пользователя
   */
  clearUserCache: async (userId) => {
    await cache.delPattern(`user:${userId}:*`);
    await sessionCache.delPattern(`user:${userId}:*`);
  },

  /**
   * Очистка кеша машины
   */
  clearMachineCache: async (machineId) => {
    await cache.delPattern(`machine:${machineId}:*`);
    await cache.delPattern(`inventory:machine:${machineId}:*`);
  },

  /**
   * Очистка всего кеша
   */
  clearAll: async () => {
    await redis.flushdb();
    logger.info('All cache cleared');
  },

  /**
   * Получение статистики кеша
   */
  getStats: async () => {
    try {
      const info = await redis.info('memory');
      const keyspace = await redis.info('keyspace');
      
      return {
        memory: info,
        keyspace: keyspace,
        connected: redis.status === 'ready'
      };
    } catch (error) {
      logger.error('Cache stats error:', error);
      return null;
    }
  },

  /**
   * Проверка здоровья кеша
   */
  healthCheck: async () => {
    try {
      const testKey = 'health_check';
      const testValue = Date.now();
      
      await cache.set(testKey, testValue, 10);
      const retrieved = await cache.get(testKey);
      await cache.del(testKey);
      
      return retrieved === testValue;
    } catch (error) {
      logger.error('Cache health check failed:', error);
      return false;
    }
  }
};

/**
 * Graceful shutdown
 */
const shutdown = async () => {
  try {
    await redis.quit();
    logger.info('Redis connection closed gracefully');
  } catch (error) {
    logger.error('Error closing Redis connection:', error);
  }
};

// Обработка завершения процесса
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = {
  // Основные экземпляры кеша
  cache,
  sessionCache,
  rateLimit,
  tempCache,
  
  // Класс для создания новых экземпляров
  Cache,
  
  // Redis клиент
  redis,
  
  // Декораторы и middleware
  cacheResult,
  cacheMiddleware,
  
  // Утилиты
  cacheUtils,
  
  // Функции управления
  createRedisClient,
  shutdown
};
