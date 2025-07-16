const { message } = require('telegraf/filters');
const logger = require('../utils/logger');

// Middleware для логирования сообщений
const loggingMiddleware = async (ctx, next) => {
  try {
    // Логируем входящие сообщения
    if (ctx.message) {
      const userId = ctx.from?.id || 'unknown';
      const username = ctx.from?.username || 'unknown';
      const messageText = ctx.message.text || '[MEDIA]';
      
      logger.info(`Incoming message from ${userId} (@${username}): ${messageText}`);
    }
    
    // Логируем callback-запросы
    if (ctx.callbackQuery) {
      const userId = ctx.from?.id || 'unknown';
      const username = ctx.from?.username || 'unknown';
      const data = ctx.callbackQuery.data || '[NO DATA]';
      
      logger.info(`Callback from ${userId} (@${username}): ${data}`);
    }
    
    // Измеряем время выполнения обработчика
    const startTime = Date.now();
    await next();
    const responseTime = Date.now() - startTime;
    
    // Логируем время выполнения
    if (responseTime > 500) {
      logger.warn(`Slow response: ${responseTime}ms`);
    } else {
      logger.debug(`Response time: ${responseTime}ms`);
    }
  } catch (error) {
    logger.error('Error in logging middleware:', error);
    await next();
  }
};

module.exports = loggingMiddleware;
