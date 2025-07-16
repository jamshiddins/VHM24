const logger = require('./logger');

/**
 * Утилиты для форматирования данных
 */

/**
 * Форматирует дату в локализованную строку
 * @param {Date|string} date - Дата для форматирования
 * @param {string} locale - Локаль (по умолчанию 'ru-RU')
 * @param {Object} options - Опции форматирования
 * @returns {string} - Отформатированная дата
 */
function formatDate(date, locale = 'ru-RU', options = {}) {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Проверяем валидность даты
    if (isNaN(dateObj.getTime())) {
      logger.warn(`Invalid date: ${date}`);
      return 'Некорректная дата';
    }
    
    // Опции по умолчанию
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    };
    
    return dateObj.toLocaleDateString(locale, defaultOptions);
  } catch (error) {
    logger.error('Error formatting date:', error);
    return String(date);
  }
}

/**
 * Форматирует время в локализованную строку
 * @param {Date|string} date - Дата для форматирования времени
 * @param {string} locale - Локаль (по умолчанию 'ru-RU')
 * @param {Object} options - Опции форматирования
 * @returns {string} - Отформатированное время
 */
function formatTime(date, locale = 'ru-RU', options = {}) {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Проверяем валидность даты
    if (isNaN(dateObj.getTime())) {
      logger.warn(`Invalid date for time formatting: ${date}`);
      return 'Некорректное время';
    }
    
    // Опции по умолчанию
    const defaultOptions = {
      hour: '2-digit',
      minute: '2-digit',
      ...options
    };
    
    return dateObj.toLocaleTimeString(locale, defaultOptions);
  } catch (error) {
    logger.error('Error formatting time:', error);
    return String(date);
  }
}

/**
 * Форматирует дату и время в локализованную строку
 * @param {Date|string} date - Дата для форматирования
 * @param {string} locale - Локаль (по умолчанию 'ru-RU')
 * @param {Object} options - Опции форматирования
 * @returns {string} - Отформатированная дата и время
 */
function formatDateTime(date, locale = 'ru-RU', options = {}) {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Проверяем валидность даты
    if (isNaN(dateObj.getTime())) {
      logger.warn(`Invalid date for datetime formatting: ${date}`);
      return 'Некорректная дата и время';
    }
    
    // Опции по умолчанию
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...options
    };
    
    return dateObj.toLocaleString(locale, defaultOptions);
  } catch (error) {
    logger.error('Error formatting datetime:', error);
    return String(date);
  }
}

/**
 * Форматирует число в денежный формат
 * @param {number} amount - Сумма
 * @param {string} currency - Валюта (по умолчанию 'RUB')
 * @param {string} locale - Локаль (по умолчанию 'ru-RU')
 * @returns {string} - Отформатированная сумма
 */
function formatCurrency(amount, currency = 'RUB', locale = 'ru-RU') {
  try {
    // Проверяем валидность суммы
    if (isNaN(amount)) {
      logger.warn(`Invalid amount: ${amount}`);
      return 'Некорректная сумма';
    }
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    logger.error('Error formatting currency:', error);
    return String(amount);
  }
}

/**
 * Форматирует число с разделителями групп разрядов
 * @param {number} number - Число для форматирования
 * @param {string} locale - Локаль (по умолчанию 'ru-RU')
 * @param {Object} options - Опции форматирования
 * @returns {string} - Отформатированное число
 */
function formatNumber(number, locale = 'ru-RU', options = {}) {
  try {
    // Проверяем валидность числа
    if (isNaN(number)) {
      logger.warn(`Invalid number: ${number}`);
      return 'Некорректное число';
    }
    
    // Опции по умолчанию
    const defaultOptions = {
      maximumFractionDigits: 2,
      ...options
    };
    
    return new Intl.NumberFormat(locale, defaultOptions).format(number);
  } catch (error) {
    logger.error('Error formatting number:', error);
    return String(number);
  }
}

module.exports = {
  formatDate,
  formatTime,
  formatDateTime,
  formatCurrency,
  formatNumber
};
