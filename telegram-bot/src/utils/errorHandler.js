/**
 * Централизованный обработчик ошибок для Telegram-бота
 * @module utils/errorHandler
 */

const logger = require('./logger');
const notificationService = require('../services/notifications');

/**
 * Обрабатывает ошибку и выполняет необходимые действия
 * @param {Error} error - Объект ошибки
 * @param {Object} ctx - Контекст Telegraf (опционально)
 * @param {string} source - Источник ошибки (модуль, функция)
 * @param {Object} additionalData - Дополнительные данные для логирования
 * @returns {Promise<void>}
 */
const handleError = async (error, ctx = null, source = 'unknown', additionalData = {}) => {
  try {
    // Формируем детальную информацию об ошибке
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      source,
      timestamp: new Date().toISOString(),
      user: ctx?.from ? {
        id: ctx.from.id,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name
      } : null,
      chat: ctx?.chat ? {
        id: ctx.chat.id,
        type: ctx.chat.type,
        title: ctx.chat.title
      } : null,
      additionalData
    };

    // Логируем ошибку
    logger.error(`Error in ${source}:`, {
      error: error.message,
      stack: error.stack,
      ...additionalData
    });

    // Определяем критичность ошибки
    const isCritical = isCriticalError(error);

    // Отправляем уведомление администраторам о критических ошибках
    if (isCritical) {
      await notifyAdminsAboutError(errorDetails);
    }

    // Отвечаем пользователю, если есть контекст
    if (ctx && ctx.reply) {
      await replyToUser(ctx, isCritical);
    }

    // Сохраняем ошибку в базу данных для дальнейшего анализа
    await saveErrorToDatabase(errorDetails);

  } catch (handlerError) {
    // Логируем ошибку в обработчике ошибок
    logger.error('Error in error handler:', handlerError);
  }
};

/**
 * Определяет, является ли ошибка критической
 * @param {Error} error - Объект ошибки
 * @returns {boolean} - true, если ошибка критическая
 */
const isCriticalError = (error) => {
  // Список критических ошибок
  const criticalErrors = [
    'ETELEGRAM',
    'EFATAL',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ECONNRESET',
    'ECONNABORTED',
    'EPROTO',
    'EACCES',
    'EPERM'
  ];

  // Проверяем, содержит ли сообщение об ошибке критические ключевые слова
  return criticalErrors.some(criticalError => 
    error.message?.includes(criticalError) || 
    error.code === criticalError
  );
};

/**
 * Отправляет уведомление администраторам о критической ошибке
 * @param {Object} errorDetails - Детали ошибки
 * @returns {Promise<void>}
 */
const notifyAdminsAboutError = async (errorDetails) => {
  try {
    const message = `🚨 *КРИТИЧЕСКАЯ ОШИБКА*\n\n` +
      `*Источник:* ${errorDetails.source}\n` +
      `*Время:* ${new Date(errorDetails.timestamp).toLocaleString('ru-RU')}\n` +
      `*Сообщение:* ${errorDetails.message}\n\n` +
      `*Пользователь:* ${errorDetails.user ? `${errorDetails.user.firstName} ${errorDetails.user.lastName} (@${errorDetails.user.username})` : 'Н/Д'}\n` +
      `*Стек вызовов:*\n\`\`\`\n${errorDetails.stack ? errorDetails.stack.substring(0, 300) + '...' : 'Н/Д'}\n\`\`\``;

    await notificationService.notifyAdmins(message);
  } catch (error) {
    logger.error('Failed to notify admins about error:', error);
  }
};

/**
 * Отвечает пользователю в случае ошибки
 * @param {Object} ctx - Контекст Telegraf
 * @param {boolean} isCritical - Флаг критичности ошибки
 * @returns {Promise<void>}
 */
const replyToUser = async (ctx, isCritical) => {
  try {
    if (isCritical) {
      await ctx.reply('❌ Произошла критическая ошибка. Администраторы уведомлены и работают над её устранением. Пожалуйста, попробуйте позже.');
    } else {
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже или обратитесь к администратору.');
    }
  } catch (error) {
    logger.error('Failed to reply to user about error:', error);
  }
};

/**
 * Сохраняет информацию об ошибке в базу данных
 * @param {Object} errorDetails - Детали ошибки
 * @returns {Promise<void>}
 */
const saveErrorToDatabase = async (errorDetails) => {
  try {
    // TODO: Реализовать сохранение ошибки в базу данных
    // В режиме разработки просто логируем
    logger.debug('Error details for database:', errorDetails);
  } catch (error) {
    logger.error('Failed to save error to database:', error);
  }
};

/**
 * Создает обработчик ошибок для middleware Telegraf
 * @param {string} source - Источник ошибки
 * @returns {Function} - Middleware для обработки ошибок
 */
const createErrorHandler = (source) => {
  return async (err, ctx, next) => {
    await handleError(err, ctx, source);
  };
};

module.exports = {
  handleError,
  createErrorHandler
};
