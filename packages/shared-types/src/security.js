/**
 * VHM24 Security Utilities
 * Общие утилиты безопасности для всех сервисов
 */

const crypto = require('crypto');

/**
 * Валидация Telegram ID
 */
function validateTelegramId(telegramId) {
  if (!telegramId) return false;
  return /^\d+$/.test(telegramId);
}

/**
 * Валидация email
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Валидация номера телефона (Узбекистан)
 */
function validatePhoneNumber(phone) {
  // Формат: +998XXXXXXXXX
  const phoneRegex = /^\+998\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * Генерация безопасного токена
 */
function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Хеширование для сравнения (например, для API ключей)
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Проверка силы пароля
 */
function validatePasswordStrength(password) {
  if (password.length < 8) {
    return { valid: false, message: 'Пароль должен содержать минимум 8 символов' };
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
    return { 
      valid: false, 
      message: 'Пароль должен содержать заглавные и строчные буквы, а также цифры' 
    };
  }
  
  return { valid: true, strength: hasSpecialChar ? 'strong' : 'medium' };
}

/**
 * Санитизация входных данных
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  // Удаляем потенциально опасные символы
  return input
    .replace(/[<>]/g, '') // Удаляем HTML теги
    .replace(/javascript:/gi, '') // Удаляем javascript: протокол
    .replace(/on\w+\s*=/gi, '') // Удаляем inline event handlers
    .trim();
}

/**
 * Проверка MIME типа файла
 */
function validateFileType(mimetype, allowedTypes = null) {
  const defaultAllowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  const types = allowedTypes || defaultAllowedTypes;
  return types.includes(mimetype);
}

/**
 * Маскирование чувствительных данных
 */
function maskSensitiveData(data, type = 'email') {
  if (!data) return '';
  
  switch (type) {
    case 'email':
      const [username, domain] = data.split('@');
      if (!domain) return '***';
      const maskedUsername = username.substring(0, 2) + '***';
      return `${maskedUsername}@${domain}`;
      
    case 'phone':
      // Показываем только последние 4 цифры
      return data.substring(0, 4) + '****' + data.substring(data.length - 4);
      
    case 'card':
      // Показываем только последние 4 цифры карты
      return '**** **** **** ' + data.substring(data.length - 4);
      
    default:
      return '***';
  }
}

/**
 * Проверка IP адреса
 */
function isValidIP(ip) {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([\da-f]{1,4}:){7}[\da-f]{1,4}$/i;
  
  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.');
    return parts.every(part => parseInt(part) >= 0 && parseInt(part) <= 255);
  }
  
  return ipv6Regex.test(ip);
}

/**
 * Rate limiting ключ
 */
function getRateLimitKey(identifier, action = 'global') {
  return `rate_limit:${action}:${identifier}`;
}

/**
 * Генерация OTP кода
 */
function generateOTP(length = 6) {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  
  return otp;
}

/**
 * Проверка CORS origin
 */
function isAllowedOrigin(origin, allowedOrigins) {
  if (!origin) return false;
  
  // Если разрешены все источники (не рекомендуется для production)
  if (allowedOrigins === true) return true;
  
  // Проверяем список разрешенных источников
  if (Array.isArray(allowedOrigins)) {
    return allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    });
  }
  
  return false;
}

/**
 * Экранирование SQL (дополнительная защита к Prisma)
 */
function escapeSql(str) {
  if (typeof str !== 'string') return str;
  
  return str
    .replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
      switch (char) {
        case "\0": return "\\0";
        case "\x08": return "\\b";
        case "\x09": return "\\t";
        case "\x1a": return "\\z";
        case "\n": return "\\n";
        case "\r": return "\\r";
        case "\"":
        case "'":
        case "\\":
        case "%":
          return "\\" + char;
        default:
          return char;
      }
    });
}

module.exports = {
  validateTelegramId,
  validateEmail,
  validatePhoneNumber,
  generateSecureToken,
  hashToken,
  validatePasswordStrength,
  sanitizeInput,
  validateFileType,
  maskSensitiveData,
  isValidIP,
  getRateLimitKey,
  generateOTP,
  isAllowedOrigin,
  escapeSql
};
