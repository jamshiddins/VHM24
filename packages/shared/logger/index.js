/**
 * Shared logger module for VHM24
 * 
 * Provides structured logging functionality with different log levels.
 * In production, logs can be configured to output to a file or external service.
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Default to INFO in development, ERROR in production
const currentLevel = process.env.NODE_ENV === 'production' 
  ? LOG_LEVELS.ERROR 
  : (process.env.LOG_LEVEL ? LOG_LEVELS[process.env.LOG_LEVEL] : LOG_LEVELS.INFO);

/**
 * Format log message with timestamp and additional data
 * 
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} data - Additional data to log
 * @returns {string} Formatted log message
 */
function formatLog(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const logObject = {
    timestamp,
    level,
    message,
    ...data
  };
  
  return JSON.stringify(logObject);
}

/**
 * Log error message
 * 
 * @param {string} message - Error message
 * @param {Error|Object} [error] - Error object or additional data
 */
function error(message, error) {
  if (currentLevel >= LOG_LEVELS.ERROR) {
    const data = error instanceof Error 
      ? { 
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      : error;
    
    console.error('\x1b[31m%s\x1b[0m', formatLog('ERROR', message, data));
  }
}

/**
 * Log warning message
 * 
 * @param {string} message - Warning message
 * @param {Object} [data] - Additional data
 */
function warn(message, data) {
  if (currentLevel >= LOG_LEVELS.WARN) {
    console.warn('\x1b[33m%s\x1b[0m', formatLog('WARN', message, data));
  }
}

/**
 * Log info message
 * 
 * @param {string} message - Info message
 * @param {Object} [data] - Additional data
 */
function info(message, data) {
  if (currentLevel >= LOG_LEVELS.INFO) {
    console.log('\x1b[36m%s\x1b[0m', formatLog('INFO', message, data));
  }
}

/**
 * Log debug message
 * 
 * @param {string} message - Debug message
 * @param {Object} [data] - Additional data
 */
function debug(message, data) {
  if (currentLevel >= LOG_LEVELS.DEBUG) {
    console.log('\x1b[90m%s\x1b[0m', formatLog('DEBUG', message, data));
  }
}

module.exports = {
  error,
  warn,
  info,
  debug,
  LOG_LEVELS
};
