/**
 * Middleware для аутентификации по токену
 * Реэкспортирует функцию requireAuth из auth.js
 */

const { requireAuth } = require('./auth');

module.exports = requireAuth;
