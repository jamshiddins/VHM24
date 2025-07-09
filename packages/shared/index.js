/**
 * VHM24 Shared Package
 * Главный экспорт всех утилит, middleware и схем
 */

const middleware = require('./middleware');
const utils = require('./utils');
const schemas = require('./schemas');

module.exports = {
  // Middleware
  middleware,
  
  // Утилиты
  utils,
  
  // Схемы валидации
  schemas,
  
  // Прямые экспорты для удобства
  ...middleware,
  ...utils,
  
  // Алиасы для быстрого доступа
  auth: middleware.auth,
  validate: middleware.validate,
  errors: middleware.errors,
  security: require('../shared-types/src/security'),
  redis: require('../shared-types/src/redis')
};
