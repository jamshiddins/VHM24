/**
 * VHM24 Shared Middleware
 * Экспорт всех middleware для использования в сервисах
 */

const security = require('./security');
const validation = require('./validation');
const errorHandler = require('./errorHandler');

module.exports = {
  // Security middleware
  ...security,
  
  // Validation middleware
  ...validation,
  
  // Error handling middleware
  ...errorHandler,
  
  // Удобные алиасы
  auth: security.authenticate,
  authorize: security.authorize,
  validate: {
    body: validation.validateBody,
    query: validation.validateQuery,
    params: validation.validateParams,
    id: validation.validateId,
    file: validation.validateFile
  },
  errors: {
    handler: errorHandler.errorHandler,
    async: errorHandler.asyncHandler,
    create: errorHandler.createError,
    register: errorHandler.registerErrorHandlers,
    setupGlobal: errorHandler.setupGlobalErrorHandlers
  }
};
