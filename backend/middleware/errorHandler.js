/**
 * Централизованный обработчик ошибок для бэкенда
 * @module middleware/errorHandler
 */

const logger = require('../utils/logger');

/**
 * Middleware для обработки ошибок Express
 * @param {Error} err - Объект ошибки
 * @param {Object} req - Объект запроса Express
 * @param {Object} res - Объект ответа Express
 * @param {Function} next - Функция next Express
 * @returns {void}
 */
const errorHandlerMiddleware = (err, req, res, next) => {
  try {
    // Формируем детальную информацию об ошибке
    const errorDetails = {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
      user: req.user ? {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role
      } : null,
      ip: req.ip,
      headers: req.headers,
      query: req.query,
      body: req.body
    };

    // Определяем статус ошибки
    const statusCode = err.statusCode || 500;

    // Логируем ошибку
    if (statusCode >= 500) {
      logger.error(`Server Error [${statusCode}] at ${req.method} ${req.path}:`, {
        error: err.message,
        stack: err.stack,
        user: errorDetails.user,
        ip: errorDetails.ip
      });
    } else {
      logger.warn(`Client Error [${statusCode}] at ${req.method} ${req.path}:`, {
        error: err.message,
        user: errorDetails.user,
        ip: errorDetails.ip
      });
    }

    // Сохраняем ошибку в базу данных для дальнейшего анализа
    saveErrorToDatabase(errorDetails).catch(dbError => {
      logger.error('Failed to save error to database:', dbError);
    });

    // Формируем ответ клиенту
    const response = {
      success: false,
      error: {
        message: getClientErrorMessage(err, statusCode),
        code: err.code || 'INTERNAL_ERROR'
      }
    };

    // В режиме разработки добавляем стек вызовов
    if (process.env.NODE_ENV === 'development') {
      response.error.stack = err.stack;
    }

    // Отправляем ответ клиенту
    res.status(statusCode).json(response);
  } catch (handlerError) {
    // Логируем ошибку в обработчике ошибок
    logger.error('Error in error handler middleware:', handlerError);
    
    // Отправляем базовый ответ об ошибке
    res.status(500).json({
      success: false,
      error: {
        message: 'Внутренняя ошибка сервера',
        code: 'INTERNAL_ERROR'
      }
    });
  }
};

/**
 * Получает сообщение об ошибке для клиента
 * @param {Error} err - Объект ошибки
 * @param {number} statusCode - HTTP-статус ошибки
 * @returns {string} - Сообщение для клиента
 */
const getClientErrorMessage = (err, statusCode) => {
  // Для 500-х ошибок не раскрываем детали клиенту
  if (statusCode >= 500) {
    return 'Внутренняя ошибка сервера. Пожалуйста, попробуйте позже.';
  }
  
  // Для 400-х ошибок возвращаем сообщение из ошибки
  return err.message || 'Произошла ошибка при обработке запроса';
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
 * Middleware для обработки 404 ошибок (маршрут не найден)
 * @param {Object} req - Объект запроса Express
 * @param {Object} res - Объект ответа Express
 * @param {Function} next - Функция next Express
 * @returns {void}
 */
const notFoundHandler = (req, res, next) => {
  const err = new Error(`Маршрут не найден: ${req.method} ${req.path}`);
  err.statusCode = 404;
  err.code = 'NOT_FOUND';
  next(err);
};

/**
 * Middleware для обработки ошибок валидации
 * @param {Object} err - Объект ошибки
 * @param {Object} req - Объект запроса Express
 * @param {Object} res - Объект ответа Express
 * @param {Function} next - Функция next Express
 * @returns {void}
 */
const validationErrorHandler = (err, req, res, next) => {
  // Проверяем, является ли ошибка ошибкой валидации
  if (err.name === 'ValidationError') {
    // Формируем детали ошибок валидации
    const validationErrors = Object.keys(err.errors).reduce((errors, key) => {
      errors[key] = err.errors[key].message;
      return errors;
    }, {});

    // Логируем ошибку валидации
    logger.warn(`Validation Error at ${req.method} ${req.path}:`, {
      errors: validationErrors,
      body: req.body
    });

    // Отправляем ответ клиенту
    return res.status(400).json({
      success: false,
      error: {
        message: 'Ошибка валидации данных',
        code: 'VALIDATION_ERROR',
        details: validationErrors
      }
    });
  }

  // Если это не ошибка валидации, передаем управление следующему обработчику
  next(err);
};

module.exports = {
  errorHandlerMiddleware,
  notFoundHandler,
  validationErrorHandler
};
