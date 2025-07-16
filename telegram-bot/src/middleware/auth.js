const apiService = require('../services/api');
const logger = require('../utils/logger');

// Middleware для проверки авторизации пользователя
const authMiddleware = async (ctx, next) => {
  try {
    // Если нет объекта from, значит это не сообщение от пользователя
    if (!ctx.from) {
      return next();
    }

    // Получаем Telegram ID пользователя
    const telegramId = ctx.from.id.toString();
    
    if (!telegramId) {
      logger.warn('Request without telegram ID');
      return next();
    }

    // Проверяем, авторизован ли пользователь
    try {
      const userData = await apiService.getUserByTelegramId(telegramId);
      
      if (userData && userData.status === 'ACTIVE') {
        // Сохраняем данные пользователя в контексте
        ctx.user = userData;
        return next();
      } else if (userData && userData.status === 'INACTIVE') {
        logger.warn(`Inactive user tried to access: ${telegramId}`);
        return ctx.reply('❌ Ваш аккаунт деактивирован. Обратитесь к администратору.');
      } else {
        logger.info(`Unauthorized user: ${telegramId}`);
        // Пользователь не авторизован, но мы пропускаем его дальше
        // для обработки команд, доступных неавторизованным пользователям
        return next();
      }
    } catch (error) {
      logger.error('API error during authentication:', error);
      // В случае ошибки API, пропускаем пользователя
      return next();
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return next();
  }
};

// Функция для проверки роли пользователя
const requireRole = (allowedRoles) => {
  return async (ctx, next) => {
    if (!ctx.user) {
      return ctx.reply('❌ Необходима авторизация для выполнения этого действия');
    }

    const userRole = ctx.user.role;
    const hasAccess = allowedRoles.includes(userRole) || userRole === 'ADMIN';
    
    if (!hasAccess) {
      logger.warn(`Access denied for user ${ctx.user.id} with role ${userRole}. Required: ${allowedRoles.join(', ')}`);
      return ctx.reply('❌ У вас нет прав для выполнения этого действия');
    }
    
    return next();
  };
};

// Функция для проверки доступа к автомату
const requireMachineAccess = (machineIdParam = 'machineId') => {
  return async (ctx, next) => {
    if (!ctx.user) {
      return ctx.reply('❌ Необходима авторизация');
    }
    
    try {
      // Получаем ID автомата из параметров
      let machineId;
      
      if (ctx.callbackQuery && ctx.callbackQuery.data) {
        // Если это callback_query, пытаемся извлечь ID из данных
        const parts = ctx.callbackQuery.data.split('_');
        machineId = parts[parts.length - 1];
      } else if (ctx.session && ctx.session[machineIdParam]) {
        // Если ID сохранен в сессии
        machineId = ctx.session[machineIdParam];
      }
      
      if (!machineId) {
        return ctx.reply('❌ Не указан ID автомата');
      }
      
      // Проверяем доступ к автомату
      const hasAccess = await apiService.checkMachineAccess(ctx.user.id, machineId);
      
      if (!hasAccess && ctx.user.role !== 'ADMIN') {
        logger.warn(`Machine access denied: user ${ctx.user.id}, machine ${machineId}`);
        return ctx.reply('❌ У вас нет доступа к этому автомату');
      }
      
      // Сохраняем ID автомата в сессии
      if (ctx.session) {
        ctx.session[machineIdParam] = machineId;
      }
      
      return next();
    } catch (error) {
      logger.error('Error checking machine access:', error);
      return ctx.reply('❌ Ошибка проверки доступа');
    }
  };
};

// Middleware для логирования действий пользователя
const logUserAction = (action) => {
  return async (ctx, next) => {
    try {
      logger.info(`User action: ${ctx.user?.id || 'unknown'} - ${action}`);
      return next();
    } catch (error) {
      logger.error(`User action failed: ${ctx.user?.id || 'unknown'} - ${action}`, error);
      return next();
    }
  };
};

module.exports = authMiddleware;
module.exports.requireRole = requireRole;
module.exports.requireMachineAccess = requireMachineAccess;
module.exports.logUserAction = logUserAction;
