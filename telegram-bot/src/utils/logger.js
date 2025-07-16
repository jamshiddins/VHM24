/**
 * Модуль для логирования сообщений в Telegram боте
 */

// Цвета для консольного вывода
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// Уровни логирования
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Текущий уровень логирования (можно изменить через переменную окружения)
let currentLogLevel = process.env.LOG_LEVEL ? 
  LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] || LOG_LEVELS.INFO : 
  LOG_LEVELS.INFO;

/**
 * Форматирует сообщение для вывода в консоль
 * @param {string} level - Уровень логирования
 * @param {string} message - Сообщение для логирования
 * @param {any} [data] - Дополнительные данные для логирования
 * @returns {string} Отформатированное сообщение
 */
const formatMessage = (level, message, data) => {
  const timestamp = new Date().toISOString();
  let prefix = '';
  
  switch (level) {
    case 'ERROR':
      prefix = `${colors.red}[${timestamp}] [ERROR]${colors.reset}`;
      break;
    case 'WARN':
      prefix = `${colors.yellow}[${timestamp}] [WARN]${colors.reset}`;
      break;
    case 'INFO':
      prefix = `${colors.blue}[${timestamp}] [INFO]${colors.reset}`;
      break;
    case 'DEBUG':
      prefix = `${colors.cyan}[${timestamp}] [DEBUG]${colors.reset}`;
      break;
    default:
      prefix = `${colors.white}[${timestamp}]${colors.reset}`;
  }
  
  let formattedMessage = `${prefix} ${message}`;
  
  if (data) {
    if (typeof data === 'object') {
      try {
        formattedMessage += `\n${JSON.stringify(data, null, 2)}`;
      } catch (error) {
        formattedMessage += `\n[Невозможно сериализовать данные: ${error.message}]`;
      }
    } else {
      formattedMessage += `\n${data}`;
    }
  }
  
  return formattedMessage;
};

/**
 * Логгер для Telegram бота
 */
const logger = {
  /**
   * Устанавливает уровень логирования
   * @param {string} level - Уровень логирования (ERROR, WARN, INFO, DEBUG)
   */
  setLogLevel: (level) => {
    if (LOG_LEVELS[level.toUpperCase()] !== undefined) {
      currentLogLevel = LOG_LEVELS[level.toUpperCase()];
      logger.info(`Уровень логирования изменен на ${level.toUpperCase()}`);
    } else {
      logger.warn(`Неизвестный уровень логирования: ${level}`);
    }
  },
  
  /**
   * Логирует сообщение об ошибке
   * @param {string} message - Сообщение для логирования
   * @param {any} [data] - Дополнительные данные для логирования
   */
  error: (message, data) => {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      console.error(formatMessage('ERROR', message, data));
    }
  },
  
  /**
   * Логирует предупреждение
   * @param {string} message - Сообщение для логирования
   * @param {any} [data] - Дополнительные данные для логирования
   */
  warn: (message, data) => {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      console.warn(formatMessage('WARN', message, data));
    }
  },
  
  /**
   * Логирует информационное сообщение
   * @param {string} message - Сообщение для логирования
   * @param {any} [data] - Дополнительные данные для логирования
   */
  info: (message, data) => {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      console.info(formatMessage('INFO', message, data));
    }
  },
  
  /**
   * Логирует отладочное сообщение
   * @param {string} message - Сообщение для логирования
   * @param {any} [data] - Дополнительные данные для логирования
   */
  debug: (message, data) => {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      console.debug(formatMessage('DEBUG', message, data));
    }
  }
};

module.exports = logger;
