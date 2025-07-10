const logger = require('@vhm24/shared/logger');

/**
 * VHM24 Telegram Bot FSM Manager
 * Управление состояниями пользователей с поддержкой Redis
 */

const { COMMON_STATES, ALL_STATES } = require('./states');

class FSMManager {
  constructor() {
    // В production используем Redis, в development - Map
    this.useRedis = process.env.NODE_ENV === 'production' && process.env.REDIS_URL;
    
    if (this.useRedis) {
      // Redis клиент будет инициализирован позже
      this.redis = null;
    } else {
      // Локальное хранилище для development
      this.userStates = new Map();
      this.userData = new Map();
    }
  }

  /**
   * Инициализация Redis клиента
   */
  async initRedis() {
    if (this.useRedis && !this.redis) {
      try {
        const Redis = require('ioredis');
        this.redis = new Redis(process.env.REDIS_URL);
        logger.info('FSM Manager: Redis connected');
      } catch (error) {
        logger.error('FSM Manager: Redis connection failed, falling back to memory:', error);
        this.useRedis = false;
        this.userStates = new Map();
        this.userData = new Map();
      }
    }
  }

  /**
   * Получить текущее состояние пользователя
   */
  async getUserState(userId) {
    try {
      if (this.useRedis && this.redis) {
        const state = await this.redis.get(`fsm:state:${userId}`);
        return state || COMMON_STATES.IDLE;
      } else {
        return this.userStates.get(userId) || COMMON_STATES.IDLE;
      }
    } catch (error) {
      logger.error('FSM Manager: Error getting user state:', error);
      return COMMON_STATES.IDLE;
    }
  }

  /**
   * Установить состояние пользователя
   */
  async setUserState(userId, state) {
    try {
      // Проверяем, что состояние валидно
      if (!Object.values(ALL_STATES).includes(state)) {
        throw new Error(`Invalid state: ${state}`);
      }

      if (this.useRedis && this.redis) {
        await this.redis.setex(`fsm:state:${userId}`, 3600, state); // TTL 1 час
        logger.info(`FSM: User ${userId} state set to ${state}`);
      } else {
        this.userStates.set(userId, state);
        logger.info(`FSM: User ${userId} state set to ${state}`);
      }
    } catch (error) {
      logger.error('FSM Manager: Error setting user state:', error);
      throw error;
    }
  }

  /**
   * Очистить состояние пользователя (вернуть в IDLE)
   */
  async clearUserState(userId) {
    try {
      if (this.useRedis && this.redis) {
        await this.redis.del(`fsm:state:${userId}`);
        await this.redis.del(`fsm:data:${userId}`);
      } else {
        this.userStates.delete(userId);
        this.userData.delete(userId);
      }
      logger.info(`FSM: User ${userId} state cleared`);
    } catch (error) {
      logger.error('FSM Manager: Error clearing user state:', error);
    }
  }

  /**
   * Получить временные данные пользователя
   */
  async getUserData(userId) {
    try {
      if (this.useRedis && this.redis) {
        const data = await this.redis.get(`fsm:data:${userId}`);
        return data ? JSON.parse(data) : {};
      } else {
        return this.userData.get(userId) || {};
      }
    } catch (error) {
      logger.error('FSM Manager: Error getting user data:', error);
      return {};
    }
  }

  /**
   * Установить временные данные пользователя
   */
  async setUserData(userId, data) {
    try {
      if (this.useRedis && this.redis) {
        await this.redis.setex(`fsm:data:${userId}`, 3600, JSON.stringify(data)); // TTL 1 час
      } else {
        this.userData.set(userId, data);
      }
    } catch (error) {
      logger.error('FSM Manager: Error setting user data:', error);
      throw error;
    }
  }

  /**
   * Обновить временные данные пользователя
   */
  async updateUserData(userId, updates) {
    try {
      const currentData = await this.getUserData(userId);
      const newData = { ...currentData, ...updates };
      await this.setUserData(userId, newData);
    } catch (error) {
      logger.error('FSM Manager: Error updating user data:', error);
      throw error;
    }
  }

  /**
   * Проверить, находится ли пользователь в определенном состоянии
   */
  async isUserInState(userId, state) {
    try {
      const currentState = await this.getUserState(userId);
      return currentState === state;
    } catch (error) {
      logger.error('FSM Manager: Error checking user state:', error);
      return false;
    }
  }

  /**
   * Проверить, находится ли пользователь в группе состояний
   */
  async isUserInStateGroup(userId, stateGroup) {
    try {
      const currentState = await this.getUserState(userId);
      return stateGroup.includes(currentState);
    } catch (error) {
      logger.error('FSM Manager: Error checking user state group:', error);
      return false;
    }
  }

  /**
   * Получить всех пользователей в определенном состоянии
   */
  async getUsersInState(state) {
    try {
      const users = [];
      
      if (this.useRedis && this.redis) {
        const keys = await this.redis.keys('fsm:state:*');
        for (const key of keys) {
          const userState = await this.redis.get(key);
          if (userState === state) {
            const userId = key.replace('fsm:state:', '');
            users.push(userId);
          }
        }
      } else {
        for (const [userId, userState] of this.userStates.entries()) {
          if (userState === state) {
            users.push(userId);
          }
        }
      }
      
      return users;
    } catch (error) {
      logger.error('FSM Manager: Error getting users in state:', error);
      return [];
    }
  }

  /**
   * Установить таймаут для состояния пользователя
   */
  async setStateTimeout(userId, timeoutMs, fallbackState = COMMON_STATES.IDLE) {
    try {
      setTimeout(async () => {
        const currentState = await this.getUserState(userId);
        if (currentState !== COMMON_STATES.IDLE) {
          logger.info(`FSM: State timeout for user ${userId}, resetting to ${fallbackState}`);
          await this.setUserState(userId, fallbackState);
          await this.clearUserData(userId);
        }
      }, timeoutMs);
    } catch (error) {
      logger.error('FSM Manager: Error setting state timeout:', error);
    }
  }

  /**
   * Очистить данные пользователя
   */
  async clearUserData(userId) {
    try {
      if (this.useRedis && this.redis) {
        await this.redis.del(`fsm:data:${userId}`);
      } else {
        this.userData.delete(userId);
      }
    } catch (error) {
      logger.error('FSM Manager: Error clearing user data:', error);
    }
  }

  /**
   * Получить статистику состояний
   */
  async getStateStatistics() {
    try {
      const stats = {};
      
      if (this.useRedis && this.redis) {
        const keys = await this.redis.keys('fsm:state:*');
        for (const key of keys) {
          const state = await this.redis.get(key);
          stats[state] = (stats[state] || 0) + 1;
        }
      } else {
        for (const state of this.userStates.values()) {
          stats[state] = (stats[state] || 0) + 1;
        }
      }
      
      return stats;
    } catch (error) {
      logger.error('FSM Manager: Error getting state statistics:', error);
      return {};
    }
  }

  /**
   * Очистить все состояния (для отладки)
   */
  async clearAllStates() {
    try {
      if (this.useRedis && this.redis) {
        const stateKeys = await this.redis.keys('fsm:state:*');
        const dataKeys = await this.redis.keys('fsm:data:*');
        const allKeys = [...stateKeys, ...dataKeys];
        
        if (allKeys.length > 0) {
          await this.redis.del(...allKeys);
        }
      } else {
        this.userStates.clear();
        this.userData.clear();
      }
      logger.info('FSM: All states cleared');
    } catch (error) {
      logger.error('FSM Manager: Error clearing all states:', error);
    }
  }
}

// Создаем единственный экземпляр
const fsmManager = new FSMManager();

module.exports = fsmManager;
