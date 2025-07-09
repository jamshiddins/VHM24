/**
 * VHM24 Shared Utils
 * Общие утилиты для всех сервисов
 */

const logger = require('./logger');
const cache = require('./cache');
const pagination = require('./pagination');
const config = require('./config');

module.exports = {
  logger,
  cache,
  pagination,
  config,
  
  // Экспортируем функции из config для прямого доступа
  ...config
};
