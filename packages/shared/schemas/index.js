/**
 * VHM24 Validation Schemas
 * Экспорт всех схем валидации
 */

const { schemas } = require('../middleware/validation');

module.exports = {
  // Экспортируем все схемы из validation middleware
  ...schemas,
  
  // Дополнительные схемы можно добавить здесь
  // customSchemas: require('./custom')
};
