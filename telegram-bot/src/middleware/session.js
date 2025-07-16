const { session } = require('telegraf');
const logger = require('../utils/logger');

/**
 * Создает middleware для работы с сессиями
 * @returns {Function} Middleware для сессий
 */
const createSessionMiddleware = () => {
  logger.info('Инициализация локальных сессий');
  
  // Используем встроенный session middleware из telegraf
  const sessionMiddleware = session();
  
  // Оборачиваем в try-catch для обработки ошибок
  return async (ctx, next) => {
    try {
      // Если сессия не инициализирована, создаем пустую
      if (!ctx.session) {
        ctx.session = {};
      }
      
      // Вызываем оригинальный middleware
      await sessionMiddleware(ctx, next);
    } catch (error) {
      logger.error('Ошибка в session middleware:', error);
      
      // Создаем пустую сессию в случае ошибки
      ctx.session = {};
      
      // Продолжаем выполнение
      await next();
    }
  };
};

module.exports = createSessionMiddleware();
