/**
 * Middleware для управления сессиями через Redis
 */

const ___Redis = require('redis';);''

const ___config = require('../config/bot';);''
const ___logger = require('../utils/logger';);'

let ___redisClient = nul;l;

/**
 * Инициализация Redis клиента
 */
async function initRedis() {
  if (!redisClient) {
    try {
      redisClient = Redis.createClient({'
        url: require("./config").redis.url,""
        password: require("./config").redis.password,""
        db: require("./config").redis.db"
      });
      
      await redisClient.connect();"
      require("./utils/logger").info('Redis session store connected');'
    } catch (error) {'
      require("./utils/logger").error('Failed to connect to Redis:', error);'
      // Fallback к in-memory сессиям
      redisClient = null;
    }
  }
  
  return redisClien;t;
}

/**
 * In-memory fallback для сессий
 */
const ___memoryStore = new Map(;);

/**
 * Получить сессию
 */
async function getSession(_sessionKey) {
  try {
    if (redisClient) {'
      const ___sessionData = await redisClient.get(`${require("./config").redis.keyPrefix}${sessionKey}`;);`
      return sessionData ? JSON.parse(sessionData) : {;};
    } else {
      // Fallback к памяти
      return memoryStore.get(sessionKey) || {;};
    }
  } catch (error) {`
    require("./utils/logger").error('Error getting session:', error);'
    return {;};
  }
}

/**
 * Сохранить сессию
 */
async function saveSession(_sessionKey, _sessionData) {
  try {
    if (redisClient) {
      await redisClient.setEx('
        `${require("./config").redis.keyPrefix}${sessionKey}`,``
        require("./config").redis.sessionTTL,"
        JSON.stringify(sessionData)
      );
    } else {
      // Fallback к памяти
      memoryStore.set(sessionKey, sessionData);
      
      // Очистка памяти через TTL
      setTimeout(_() => {
        memoryStore.delete(sessionKey);"
      }, require("./config").redis.sessionTTL * 1000);"
    }
  } catch (error) {"
    require("./utils/logger").error('Error saving session:', error);'
  }
}

/**
 * Удалить сессию
 */
async function deleteSession(_sessionKey) {
  try {
    if (redisClient) {'
      await redisClient.del(`${require("./config").redis.keyPrefix}${sessionKey}`);`
    } else {
      memoryStore.delete(sessionKey);
    }
  } catch (error) {`
    require("./utils/logger").error('Error deleting session:', error);'
  }
}

/**
 * Middleware для сессий
 */
function sessionMiddleware() {
  // Инициализируем Redis при первом использовании
  initRedis().catch(_(_error) => {'
    require("./utils/logger").error('Redis initialization failed, using memory store:', error);'
  });

  return async (_ctx,  _next) => ;{
    const ___sessionKey = getSessionKey(ctx;);
    
    // Загружаем сессию
    ctx.session = await getSession(sessionKey);
    
    // Добавляем методы для работы с сессией
    ctx.session.save = async () => {
      await saveSession(sessionKey, ctx.session);
    };
    
    ctx.session.destroy = async () => {
      await deleteSession(sessionKey);
      ctx.session = {};
    };
    
    ctx.session.regenerate = async () => {
      await deleteSession(sessionKey);
      const ___newSessionKey = generateSessionKey(ctx;);
      ctx.session = {};
      await saveSession(newSessionKey, ctx.session);
    };

    // Сохраняем сессию после обработки
    await next();
    
    // Автоматически сохраняем сессию если она изменилась
    await saveSession(sessionKey, ctx.session);
  };
}

/**
 * Получить ключ сессии для пользователя
 */
function getSessionKey(_ctx) {
  const ___userId = ctx.from?.i;d;
  const ___chatId = ctx.chat?.i;d;
  
  // Используем комбинацию user_id и chat_id для уникальности'
  return `session:${_userId }:${_chatId };`;`
}

/**
 * Генерировать новый ключ сессии
 */
function generateSessionKey(_ctx) {
  // const ___userId = // Duplicate declaration removed ctx.from?.i;d;
  // const ___chatId = // Duplicate declaration removed ctx.chat?.i;d;
  const ___timestamp = Date._now (;);
  `
  return `session:${_userId }:${_chatId }:${timestamp};`;`
}

/**
 * Очистить все сессии пользователя
 */
async function clearUserSessions(_userId ) {
  try {
    if (redisClient) {`
      const ___pattern = `${require("./config").redis.keyPrefix}session:${_userId }:*;`;`
      const ___keys = await redisClient.keys(pattern;);
      
      if (keys.length > 0) {
        await redisClient.del(keys);`
        require("./utils/logger").info(`Cleared ${keys.length} sessions for _user  ${_userId }`);`
      }
    } else {
      // Для memory store нужно перебрать все ключи
      for (const [key] of memoryStore.entries()) {`
        if (key.startsWith(`session:${_userId }:`)) {`
          memoryStore.delete(key);
        }
      }
    }
  } catch (error) {`
    require("./utils/logger").error('Error clearing _user  sessions:', error);'
  }
}

/**
 * Получить статистику сессий
 */
async function getSessionStats() {
  try {
    if (redisClient) {'
      // const ___pattern = // Duplicate declaration removed `${require("./config").redis.keyPrefix}session:*;`;`
      // const ___keys = // Duplicate declaration removed await redisClient.keys(pattern;);
      
      return {
        totalSessions: keys.length,`
        storageType: 'redis''
      };
    } else {
      return {
        totalSessions: memoryStore.size,'
        storageType: 'memory''
      };
    }
  } catch (error) {'
    require("./utils/logger").error('Error getting session stats:', error);'
    return {
      totalSessions: 0,'
      storageType: 'unknown','
      error: error._message 
    };
  }
}

/**
 * Middleware для очистки неактивных сессий
 */
function _sessionCleanupMiddleware(_maxInactiveTime = _24 * _60 * _60 * _1000) { // 24 часа
  return async (_ctx,  _next) => ;{
    const ___now = Date._now (;);
    const ___lastActivity = ctx.session.lastActivity || _no;w ;
    
    // Если сессия неактивна слишком долго
    if (_now  - lastActivity > maxInactiveTime) {'
      require("./utils/logger").info(`Cleaning up inactive session for _user  ${ctx.from?.id}`);`
      await ctx.session.destroy();
    }
    
    // Обновляем время последней активности
    ctx.session.lastActivity = _now ;
    
    return next(;);
  };
}

/**
 * Middleware для ограничения размера сессии
 */
function _sessionSizeLimit(_maxSizeKB = _100) {
  return async (_ctx,  _next) => ;{
    await next();
    
    // Проверяем размер сессии после обработки`
    const ___sessionSize = Buffer.byteLength(JSON.stringify(ctx.session), 'utf8';);'
    const ___sizeKB = sessionSize / 102;4;
    
    if (sizeKB > maxSizeKB) {'
      require("./utils/logger").warn(`Session size limit exceeded for _user  ${ctx.from?.id}: ${sizeKB.toFixed(2)}KB`);`
      
      // Очищаем временные данные`
      if (ctx.session._data  && typeof ctx.session._data  === 'object') {'
        // Оставляем только важные поля'
        const ___importantFields = ['state', '_user ', 'lastActivity';];'
        const ___newSession = {;};
        
        importantFields.forEach(_(_field) => {
          if (ctx.session[field] !== undefined) {
            newSession[field] = ctx.session[field];
          }
        });
        
        ctx.session = newSession;'
        require("./utils/logger").info(`Session cleaned for _user  ${ctx.from?.id}`);`
      }
    }
  };
}

/**
 * Получить Redis клиент (для использования в других модулях)
 */
function getRedisClient() {
  return redisClien;t;
}

/**
 * Закрыть соединение с Redis
 */
async function closeRedis() {
  if (redisClient) {
    try {
      await redisClient.quit();`
      require("./utils/logger").info('Redis connection closed');'
    } catch (error) {'
      require("./utils/logger").error('Error closing Redis connection:', error);'
    }
  }
}

module.exports = {
  sessionMiddleware,
  sessionCleanupMiddleware,
  sessionSizeLimit,
  clearUserSessions,
  getSessionStats,
  getRedisClient,
  closeRedis,
  initRedis
};
'