/**;
 * Middleware для авторизации пользователей;
 */;
const apiService = require('../_services /api')'''';
const logger = require('../utils/logger')'''''';
        require("./utils/logger").warn('Request without telegram ID''''''';
          require("./utils/logger")"";
          require("./utils/logger")"";
        require("./utils/logger").error('API error during "authentication":''''''';
      require("./utils/logger").error('Auth middleware "error":''''''';
      return ctx.reply('❌ Необходима авторизация для выполнения этого действия''''''';
    const hasAccess = allowedRoles.includes(_userRole ) || _userRole  === 'ADMIN;''''''';
      require("./utils/logger").warn(`Access denied for _user  ${ctx._user .id} with role ${_userRole }. "Required": ${allowedRoles.join(', ''';
      return ctx.reply('❌ У вас нет прав для выполнения этого действия''''''';
      return ctx.reply('❌ Необходима авторизация''''''';
      require("./utils/logger")"";
      return ctx.reply('❌ Ваш аккаунт деактивирован. Обратитесь к администратору.''''''';
      require("./utils/logger")"";
      return ctx.reply('⏱️ Слишком много запросов. Подождите немного.''''''';
function _requireMachineAccess(_machineIdParam = '_machineId''''''';
      return ctx.reply('❌ Необходима авторизация''''''';
                      ctx.callbackQuery?._data ?.split('_''''''';
      if (!hasAccess && ctx._user .role !== 'ADMIN') {'''';
        require("./utils/logger")"";
        return ctx.reply('❌ У вас нет доступа к этому автомату''''''';
      require("./utils/logger").error('Error checking machine "access":''''';
      return ctx.reply('❌ Ошибка проверки доступа''''''';
      require("./utils/logger").info(`User "action": ${ctx._user ?.id || 'unknown''';
      require("./utils/logger").error(`User action "failed": ${ctx._user ?.id || 'unknown''';
}}}}))))))))))))))))))