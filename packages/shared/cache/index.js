/**
 * Модуль для работы с кэшированием
 * @module @vhm24/shared/cache
 */

const Redis = require('ioredis');
const { promisify } = require('util');
const logger = require('../logger');

// Проверка наличия Redis
let redis;
try {
  // Создаем подключение к Redis
  redis = new Redis(process.env.REDIS_URL);
  
  // Проверяем подключение
  redis.on('connect', () => {
    logger.info('Redis connected successfully');
  });
  
  redis.on('error', (error) => {
    logger.error(`Redis connection error: ${error.message}`);
    // Если Redis недоступен, используем in-memory кэш
    redis = null;
  });
} catch (error) {
  logger.warn(`Redis not available: ${error.message}. Using in-memory cache instead.`);
  redis = null;
}

// Время жизни кэша по умолчанию (1 час)
const DEFAULT_TTL = 3600;

// In-memory кэш для случаев, когда Redis недоступен
const memoryCache = new Map();

/**
 * Получает данные из кэша
 * @param {string} key - Ключ кэша
 * @returns {Promise<any>} Данные из кэша или null, если кэш не найден
 */
async function get(key) {
  try {
    if (redis) {
      const data = await redis.get(key);
      if (!data) return null;
      
      try {
        return JSON.parse(data);
      } catch (error) {
        return data;
      }
    } else {
      // Используем in-memory кэш
      const cached = memoryCache.get(key);
      if (!cached) return null;
      
      // Проверяем срок действия кэша
      if (cached.expires && Date.now() > cached.expires) {
        memoryCache.delete(key);
        return null;
      }
      
      return cached.data;
    }
  } catch (error) {
    logger.error(`Cache get error: ${error.message}`);
    return null;
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
  try {
    const serialized = typeof data === 'string' ? data : JSON.stringify(data);
    
    if (redis) {
      return redis.set(key, serialized, 'EX', ttl);
    } else {
      // Используем in-memory кэш
      memoryCache.set(key, {
        data,
        expires: ttl ? Date.now() + (ttl * 1000) : null
      });
      return true;
    }
  } catch (error) {
    logger.error(`Cache set error: ${error.message}`);
    return false;
  }
}

/**
 * Удаляет данные из кэша
 * @param {string} key - Ключ кэша
 * @returns {Promise<boolean>} Результат операции
 */
async function del(key) {
  try {
    if (redis) {
      return redis.del(key);
    } else {
      // Используем in-memory кэш
      return memoryCache.delete(key);
    }
  } catch (error) {
    logger.error(`Cache delete error: ${error.message}`);
    return false;
  }
}

/**
 * Удаляет данные из кэша по шаблону
 * @param {string} pattern - Шаблон ключа
 * @returns {Promise<number>} Количество удаленных ключей
 */
async function delByPattern(pattern) {
  try {
    if (redis) {
      const keys = await redis.keys(pattern);
      if (keys.length === 0) return 0;
      
      return redis.del(keys);
    } else {
      // Используем in-memory кэш
      const regex = new RegExp(pattern.replace('*', '.*'));
      let count = 0;
      
      for (const key of memoryCache.keys()) {
        if (regex.test(key)) {
          memoryCache.delete(key);
          count++;
        }
      }
      
      return count;
    }
  } catch (error) {
    logger.error(`Cache delete by pattern error: ${error.message}`);
    return 0;
  }
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
      req.log.info({ cacheHit: true, cacheKey }, 'Cache hit');
      return reply.send(cachedData);
    }
    
    req.log.info({ cacheHit: false, cacheKey }, 'Cache miss');
    
    // Сохраняем оригинальный метод send
    const originalSend = reply.send;
    
    // Переопределяем метод send для сохранения ответа в кэш
    reply.send = function(payload) {
      set(cacheKey, payload, ttl);
      return originalSend.call(this, payload);
    };
  };
}

/**
 * Создает функцию для инвалидации кэша по шаблону
 * @param {string} pattern - Шаблон ключа
 * @returns {Function} Функция для инвалидации кэша
 */
function createCacheInvalidator(pattern) {
  return async () => {
    const count = await delByPattern(pattern);
    logger.info(`Invalidated ${count} cache entries matching pattern: ${pattern}`);
    return count;
  };
}

module.exports = {
  redis,
  get,
  set,
  del,
  delByPattern,
  cacheMiddleware,
  createCacheInvalidator
};
