/**
 * Утилита для логирования
 */

/**
 * Простой логгер для Telegram-бота
 */
class Logger {
  /**
   * Логирование информационного сообщения
   * @param {string} message - Сообщение для логирования
   * @param {Object} data - Дополнительные данные
   */
  info(message, data = {}) {
    this.log('INFO', message, data);
  }
  
  /**
   * Логирование предупреждения
   * @param {string} message - Сообщение для логирования
   * @param {Object} data - Дополнительные данные
   */
  warn(message, data = {}) {
    this.log('WARN', message, data);
  }
  
  /**
   * Логирование ошибки
   * @param {string} message - Сообщение для логирования
   * @param {Object|Error} error - Объект ошибки или дополнительные данные
   */
  error(message, error = {}) {
    let errorData = {};
    
    if (error instanceof Error) {
      errorData = {
        message: error.message,
        stack: error.stack,
        name: error.name
      };
    } else if (typeof error === 'object') {
      errorData = error;
    }
    
    this.log('ERROR', message, errorData);
  }
  
  /**
   * Логирование отладочной информации
   * @param {string} message - Сообщение для логирования
   * @param {Object} data - Дополнительные данные
   */
  debug(message, data = {}) {
    if (process.env.NODE_ENV !== 'production') {
      this.log('DEBUG', message, data);
    }
  }
  
  /**
   * Базовая функция логирования
   * @param {string} level - Уровень логирования
   * @param {string} message - Сообщение для логирования
   * @param {Object} data - Дополнительные данные
   */
  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      ...data
    };
    
    // В зависимости от уровня логирования используем разные методы консоли
    switch (level) {
      case 'ERROR':
        console.error(`[${timestamp}] [${level}] ${message}`, Object.keys(data).length ? data : '');
        break;
      case 'WARN':
        console.warn(`[${timestamp}] [${level}] ${message}`, Object.keys(data).length ? data : '');
        break;
      case 'DEBUG':
        console.debug(`[${timestamp}] [${level}] ${message}`, Object.keys(data).length ? data : '');
        break;
      default:
        console.log(`[${timestamp}] [${level}] ${message}`, Object.keys(data).length ? data : '');
    }
    
    // Здесь можно добавить сохранение логов в файл или отправку в систему мониторинга
  }
}

module.exports = new Logger();
