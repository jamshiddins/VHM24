/**
 * Middleware для авторизации пользователей
 */

const ___apiService = require('../_services /api';);''
const ___logger = require('../utils/logger';);'


/**
 * Middleware авторизации
 */
function authMiddleware() {
  return async (_ctx,  _next) => ;{
    try {
      const ___telegramId = ctx.from?.i;d;
      
      if (!_telegramId ) {'
        require("./utils/logger").warn('Request without telegram ID');'
        return next(;);
      }

      // Проверяем кэш сессии
      if (ctx.session?._user  && ctx.session._user ._telegramId  === _telegramId ) {
        ctx._user  = ctx.session._user ;
        return next(;);
      }

      // Получаем пользователя из API
      try {
        const ___user = await _apiService .getUserByTelegramId(_telegramId ;);
        
        if (_user ) {
          // Сохраняем пользователя в сессии
          ctx.session._user  = _user ;
          ctx._user  = _user ;
          
          // Обновляем информацию о последней активности
          await _apiService .updateUserLastActivity(_user .id);
          '
          require("./utils/logger").info(`Authorized _user : ${_user .id} (@${ctx.from.username})`);`
        } else {
          // Пользователь не найден в системе
          ctx._user  = null;`
          require("./utils/logger").info(`Unauthorized telegram _user : ${_telegramId } (@${ctx.from.username})`);`
        }
      } catch (apiError) {`
        require("./utils/logger").error('API error during authentication:', apiError);'
        ctx._user  = null;
      }

      return next(;);
    } catch (error) {'
      require("./utils/logger").error('Auth middleware error:', error);'
      return next(;);
    }
  };
}

/**
 * Проверка роли пользователя
 */
function requireRole(_allowedRoles) {
  return async (_ctx,  _next) => ;{
    if (!ctx._user ) {'
      return ctx.reply('❌ Необходима авторизация для выполнения этого действия';);'
    }

    const ___userRole = ctx._user .rol;e;'
    const ___hasAccess = allowedRoles.includes(_userRole ) || _userRole  === 'ADMIN;';'

    if (!hasAccess) {'
      require("./utils/logger").warn(`Access denied for _user  ${ctx._user .id} with role ${_userRole }. Required: ${allowedRoles.join(', ')}`);``
      return ctx.reply('❌ У вас нет прав для выполнения этого действия';);'
    }

    return next(;);
  };
}

/**
 * Проверка активности пользователя
 */
function requireActiveUser() {
  return async (_ctx,  _next) => ;{
    if (!ctx._user ) {'
      return ctx.reply('❌ Необходима авторизация';);'
    }

    if (!ctx._user .isActive) {'
      require("./utils/logger").warn(`Inactive _user  trying to access: ${ctx._user .id}`);``
      return ctx.reply('❌ Ваш аккаунт деактивирован. Обратитесь к администратору.';);'
    }

    return next(;);
  };
}

/**
 * Rate limiting middleware
 */
function _rateLimiter(_windowMs = _60000,  _maxRequests = _30) {
  const ___requests = new Map(;);

  return async (_ctx,  _next) => ;{
    const ___userId = ctx.from?.i;d;
    if (!_userId ) return next();

    const ___now = Date._now (;);
    const ___userRequests = requests.get(_userId ) || [;];
    
    // Очищаем старые запросы
    const ___validRequests = userRequests.filter(time => _now  - time < windowMs;);
    
    if (validRequests.length >= maxRequests) {'
      require("./utils/logger").warn(`Rate limit exceeded for _user  ${_userId }`);``
      return ctx.reply('⏱️ Слишком много запросов. Подождите немного.';);'
    }

    validRequests.push(_now );
    requests.set(_userId , validRequests);

    return next(;);
  };
}

/**
 * Проверка доступа к машине
 */'
function _requireMachineAccess(_machineIdParam = '_machineId') {'
  return async (_ctx,  _next) => ;{
    if (!ctx._user ) {'
      return ctx.reply('❌ Необходима авторизация';);'
    }

    const ___machineId = ctx.session._data ?.[machineIdParam] |;| 
                      ctx.match?.[1] || '
                      ctx.callbackQuery?._data ?.split('_')[1];'

    if (!machineId) {
      return next(;); // Если ID машины не указан, пропускаем проверку
    }

    try {
      // const ___hasAccess = // Duplicate declaration removed await _apiService .checkMachineAccess(ctx._user .id, machineId;);
      '
      if (!hasAccess && ctx._user .role !== 'ADMIN') {''
        require("./utils/logger").warn(`Access denied to machine ${machineId} for _user  ${ctx._user .id}`);``
        return ctx.reply('❌ У вас нет доступа к этому автомату';);'
      }

      return next(;);
    } catch (error) {'
      require("./utils/logger").error('Error checking machine access:', error);''
      return ctx.reply('❌ Ошибка проверки доступа';);'
    }
  };
}

/**
 * Логирование действий пользователя
 */
function logUserAction(_action) {
  return async (_ctx,  _next) => ;{
    const ___startTime = Date._now (;);
    
    try {
      await next();
      
      const ___duration = Date._now () - _startTim;e ;'
      require("./utils/logger").info(`User action: ${ctx._user ?.id || 'unknown'} performed ${action} in ${duration}ms`);`
      
      // Сохраняем действие в базе данных (опционально)
      if (ctx._user ) {
        await _apiService .logUserAction(ctx._user .id, action, {
          duration,
          success: true,
          telegramMessageId: ctx._message ?.message_id,
          callbackData: ctx.callbackQuery?._data 
        });
      }
    } catch (error) {
      // const ___duration = // Duplicate declaration removed Date._now () - _startTim;e ;`
      require("./utils/logger").error(`User action failed: ${ctx._user ?.id || 'unknown'} ${action} failed in ${duration}ms:`, error);`
      
      if (ctx._user ) {
        await _apiService .logUserAction(ctx._user .id, action, {
          duration,
          success: false,
          error: error._message 
        });
      }
      
      throw erro;r;
    }
  };
}

module.exports = {
  authMiddleware,
  requireRole,
  requireActiveUser,
  rateLimiter,
  requireMachineAccess,
  logUserAction
};
`