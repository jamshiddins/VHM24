const crypto = require('crypto');

const helpers = {
  // Генерация UUID
  generateUUID() {
    return crypto.randomUUID();
  },

  // Генерация случайной строки
  generateRandomString(length = 10) {
    return crypto.randomBytes(length).toString('hex').slice(0, length);
  },

  // Форматирование даты
  formatDate(date, format = 'YYYY-MM-DD') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  },

  // Очистка строки
  sanitizeString(str) {
    return str.replace(/[<>]/g, '');
  },

  // Проверка на пустоту
  isEmpty(value) {
    return value === null || value === undefined || value === '';
  },

  // Глубокое копирование объекта
  deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  // Задержка (для async/await)
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // Капитализация строки
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  // Обрезка строки
  truncate(str, length, suffix = '...') {
    if (str.length <= length) return str;
    return str.substring(0, length) + suffix;
  },

  // Проверка валидности email
  isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  // Маскирование чувствительных данных
  maskSensitiveData(data, fieldsToMask = ['password', 'token', 'secret']) {
    const masked = this.deepCopy(data);
    
    const maskValue = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          maskValue(obj[key]);
        } else if (fieldsToMask.includes(key.toLowerCase())) {
          obj[key] = '***';
        }
      }
    };

    maskValue(masked);
    return masked;
  },

  // Получение IP адреса из запроса
  getClientIP(req) {
    return req.headers['x-forwarded-for'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null);
  },

  // Конвертация размера файла в читаемый формат
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Проверка статуса HTTP
  isSuccessStatus(status) {
    return status >= 200 && status < 300;
  },

  // Создание response объекта
  createResponse(success, data = null, message = null, errors = null) {
    return {
      success,
      data,
      message,
      errors,
      timestamp: new Date().toISOString()
    };
  }
};

module.exports = helpers;
