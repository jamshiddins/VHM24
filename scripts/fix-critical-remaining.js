const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚨 Исправление оставшихся критических проблем VHM24\n');

// Функция для создания директории, если она не существует
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Создана директория: ${dirPath}`);
    return true;
  }
  return false;
}

// Функция для поиска hardcoded credentials в файле
function findHardcodedCredentials(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ Файл не найден: ${filePath}`);
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const credentials = [];

  // Регулярные выражения для поиска различных типов credentials
  const patterns = [
    // Пароли
    { regex: /(?:password|pwd|passwd|secret)\s*[:=]\s*['"]([^'"]{8,})['"]/gi, type: 'password' },
    // API ключи
    { regex: /(?:api[_-]?key|apikey|token)\s*[:=]\s*['"]([a-zA-Z0-9_\-\.]{20,})['"]/gi, type: 'api_key' },
    // JWT секреты
    { regex: /(?:jwt[_-]?secret|jwtsecret)\s*[:=]\s*['"]([^'"]{16,})['"]/gi, type: 'jwt_secret' },
    // URL с credentials
    { regex: /(?:https?:\/\/)([^:]+):([^@]+)@/gi, type: 'url_with_credentials' },
    // Хардкодед ID
    { regex: /PASSWORD_\d+\s*=\s*['"]([^'"]+)['"]/gi, type: 'hardcoded_password' }
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.regex.exec(content)) !== null) {
      credentials.push({
        type: pattern.type,
        value: match[1],
        line: content.substring(0, match.index).split('\n').length,
        match: match[0]
      });
    }
  });

  return credentials;
}

// Функция для замены hardcoded credentials на переменные окружения
function replaceHardcodedCredentials(filePath, credentials) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ Файл не найден: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const envVars = {};

  credentials.forEach(cred => {
    // Генерируем имя переменной окружения
    let envVarName;
    switch (cred.type) {
      case 'password':
        envVarName = `PASSWORD_${Math.floor(Math.random() * 1000)}`;
        break;
      case 'api_key':
        envVarName = `API_KEY_${Math.floor(Math.random() * 1000)}`;
        break;
      case 'jwt_secret':
        envVarName = 'JWT_SECRET';
        break;
      case 'url_with_credentials':
        envVarName = `URL_${Math.floor(Math.random() * 1000)}`;
        break;
      case 'hardcoded_password':
        // Для PASSWORD_123 = "value" оставляем имя переменной как есть
        const passwordMatch = cred.match.match(/PASSWORD_\d+/);
        if (passwordMatch) {
          envVarName = passwordMatch[0];
        } else {
          envVarName = `PASSWORD_${Math.floor(Math.random() * 1000)}`;
        }
        break;
      default:
        envVarName = `SECRET_${Math.floor(Math.random() * 1000)}`;
    }

    // Заменяем hardcoded credentials на process.env
    const replacement = cred.match.replace(cred.value, `\${process.env.${envVarName}}`);
    content = content.replace(cred.match, replacement);
    
    // Сохраняем значение для добавления в .env
    envVars[envVarName] = cred.value;
    
    modified = true;
  });

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Заменены hardcoded credentials в ${filePath}`);
    
    // Добавляем переменные в .env файл
    let envContent = '';
    if (fs.existsSync('.env')) {
      envContent = fs.readFileSync('.env', 'utf8');
    }
    
    let envUpdated = false;
    Object.entries(envVars).forEach(([key, value]) => {
      if (!envContent.includes(`${key}=`)) {
        envContent += `\n${key}=${value}`;
        envUpdated = true;
      }
    });
    
    if (envUpdated) {
      fs.writeFileSync('.env', envContent);
      console.log(`✅ Добавлены переменные окружения в .env файл`);
    }
    
    return true;
  }

  return false;
}

// Функция для добавления валидации входных данных
function addInputValidation(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ Файл не найден: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Проверяем, есть ли уже валидация
  if (content.includes('schema') && content.includes('validator')) {
    return false;
  }
  
  // Ищем fastify.post, fastify.put, fastify.patch
  const routeRegex = /(fastify\.(post|put|patch))\s*\(\s*['"]([^'"]+)['"]\s*,\s*(?:async\s*)?\(?([^)]*)\)?\s*=>\s*{/g;
  
  let modified = false;
  let match;
  
  // Создаем копию контента для модификации
  let newContent = content;
  
  // Добавляем импорт валидатора, если его нет
  if (!content.includes('require(\'@vhm24/shared/middleware/validation\')') && 
      !content.includes('require("@vhm24/shared/middleware/validation")')) {
    
    // Находим первую строку с require или const
    const requireRegex = /(const|let|var)\s+.*\s*=\s*require\s*\(['"]/;
    const requireMatch = content.match(requireRegex);
    
    if (requireMatch) {
      const index = requireMatch.index;
      newContent = content.substring(0, index) + 
                  "const { createValidator } = require('@vhm24/shared/middleware/validation');\n" + 
                  content.substring(index);
      modified = true;
    } else {
      // Если нет require, добавляем в начало файла
      newContent = "const { createValidator } = require('@vhm24/shared/middleware/validation');\n" + content;
      modified = true;
    }
  }
  
  // Для каждого маршрута добавляем валидацию
  while ((match = routeRegex.exec(content)) !== null) {
    const [fullMatch, method, httpMethod, route, params] = match;
    
    // Создаем схему валидации
    const schemaName = `${httpMethod}${route.replace(/\//g, '_').replace(/:/g, '')}Schema`;
    const validationCode = `
// Схема валидации для ${httpMethod.toUpperCase()} ${route}
const ${schemaName} = {
  body: {
    type: 'object',
    required: [],
    properties: {
      // TODO: Добавьте свойства для валидации
    },
    additionalProperties: false
  }
};

`;
    
    // Создаем валидатор
    const validatorName = `validate${httpMethod.charAt(0).toUpperCase() + httpMethod.slice(1)}${route.replace(/\//g, '_').replace(/:/g, '')}`;
    const validatorCode = `const ${validatorName} = createValidator(${schemaName});\n\n`;
    
    // Модифицируем маршрут, добавляя валидатор
    const newRoute = `${method}('${route}', { preValidation: ${validatorName} }, async ${params} => {`;
    
    // Заменяем в новом контенте
    if (!newContent.includes(schemaName) && !newContent.includes(validatorName)) {
      // Находим место перед первым маршрутом
      const routeIndex = newContent.indexOf('fastify.get') || newContent.indexOf('fastify.post') || 
                         newContent.indexOf('fastify.put') || newContent.indexOf('fastify.patch');
      
      if (routeIndex !== -1) {
        newContent = newContent.substring(0, routeIndex) + 
                    validationCode + validatorCode + 
                    newContent.substring(routeIndex);
      }
      
      // Заменяем маршрут
      newContent = newContent.replace(fullMatch, newRoute);
      modified = true;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ Добавлена валидация входных данных в ${filePath}`);
    return true;
  }
  
  return false;
}

// Функция для создания файла middleware/validation.js, если его нет
function createValidationMiddleware() {
  const dirPath = path.join('packages', 'shared', 'middleware');
  const filePath = path.join(dirPath, 'validation.js');
  
  ensureDirectoryExists(dirPath);
  
  if (!fs.existsSync(filePath)) {
    const content = `/**
 * Модуль для валидации входных данных
 * @module @vhm24/shared/middleware/validation
 */

/**
 * Создает middleware для валидации запросов
 * @param {Object} schema - JSON Schema для валидации
 * @returns {Function} Middleware функция для fastify
 */
function createValidator(schema) {
  return function validator(request, reply, done) {
    const { body, query, params } = request;
    
    // Валидация body
    if (schema.body && body) {
      const bodyValidation = validateObject(body, schema.body);
      if (!bodyValidation.valid) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: \`Validation error: \${bodyValidation.errors.join(', ')}\`
        });
      }
    }
    
    // Валидация query
    if (schema.query && query) {
      const queryValidation = validateObject(query, schema.query);
      if (!queryValidation.valid) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: \`Validation error: \${queryValidation.errors.join(', ')}\`
        });
      }
    }
    
    // Валидация params
    if (schema.params && params) {
      const paramsValidation = validateObject(params, schema.params);
      if (!paramsValidation.valid) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: \`Validation error: \${paramsValidation.errors.join(', ')}\`
        });
      }
    }
    
    done();
  };
}

/**
 * Валидирует объект по схеме
 * @param {Object} obj - Объект для валидации
 * @param {Object} schema - JSON Schema
 * @returns {Object} Результат валидации { valid: boolean, errors: string[] }
 */
function validateObject(obj, schema) {
  const errors = [];
  
  // Проверка required полей
  if (schema.required && Array.isArray(schema.required)) {
    for (const field of schema.required) {
      if (obj[field] === undefined) {
        errors.push(\`Field '\${field}' is required\`);
      }
    }
  }
  
  // Проверка типов и форматов
  if (schema.properties && typeof schema.properties === 'object') {
    for (const [field, propSchema] of Object.entries(schema.properties)) {
      if (obj[field] !== undefined) {
        // Проверка типа
        if (propSchema.type && !checkType(obj[field], propSchema.type)) {
          errors.push(\`Field '\${field}' must be of type \${propSchema.type}\`);
        }
        
        // Проверка формата
        if (propSchema.format && !checkFormat(obj[field], propSchema.format)) {
          errors.push(\`Field '\${field}' must match format \${propSchema.format}\`);
        }
        
        // Проверка минимальной длины
        if (propSchema.minLength !== undefined && typeof obj[field] === 'string' && 
            obj[field].length < propSchema.minLength) {
          errors.push(\`Field '\${field}' must be at least \${propSchema.minLength} characters long\`);
        }
        
        // Проверка максимальной длины
        if (propSchema.maxLength !== undefined && typeof obj[field] === 'string' && 
            obj[field].length > propSchema.maxLength) {
          errors.push(\`Field '\${field}' must be at most \${propSchema.maxLength} characters long\`);
        }
        
        // Проверка минимального значения
        if (propSchema.minimum !== undefined && typeof obj[field] === 'number' && 
            obj[field] < propSchema.minimum) {
          errors.push(\`Field '\${field}' must be at least \${propSchema.minimum}\`);
        }
        
        // Проверка максимального значения
        if (propSchema.maximum !== undefined && typeof obj[field] === 'number' && 
            obj[field] > propSchema.maximum) {
          errors.push(\`Field '\${field}' must be at most \${propSchema.maximum}\`);
        }
        
        // Проверка enum
        if (propSchema.enum && Array.isArray(propSchema.enum) && 
            !propSchema.enum.includes(obj[field])) {
          errors.push(\`Field '\${field}' must be one of: \${propSchema.enum.join(', ')}\`);
        }
      }
    }
  }
  
  // Проверка additionalProperties
  if (schema.additionalProperties === false) {
    const allowedProps = Object.keys(schema.properties || {});
    for (const field of Object.keys(obj)) {
      if (!allowedProps.includes(field)) {
        errors.push(\`Field '\${field}' is not allowed\`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Проверяет соответствие значения указанному типу
 * @param {*} value - Значение для проверки
 * @param {string} type - Тип для проверки
 * @returns {boolean} Результат проверки
 */
function checkType(value, type) {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'integer':
      return Number.isInteger(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    case 'null':
      return value === null;
    default:
      return true;
  }
}

/**
 * Проверяет соответствие значения указанному формату
 * @param {*} value - Значение для проверки
 * @param {string} format - Формат для проверки
 * @returns {boolean} Результат проверки
 */
function checkFormat(value, format) {
  if (typeof value !== 'string') {
    return false;
  }
  
  switch (format) {
    case 'email':
      return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/.test(value);
    case 'uri':
      try {
        new URL(value);
        return true;
      } catch (e) {
        return false;
      }
    case 'uuid':
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
    case 'date-time':
      return !isNaN(Date.parse(value));
    case 'date':
      return /^\\d{4}-\\d{2}-\\d{2}$/.test(value);
    case 'time':
      return /^\\d{2}:\\d{2}:\\d{2}$/.test(value);
    case 'ipv4':
      return /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(value);
    case 'ipv6':
      return /^(?:[0-9a-f]{1,4}:){7}[0-9a-f]{1,4}$/i.test(value);
    default:
      return true;
  }
}

module.exports = {
  createValidator
};
`;
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Создан файл middleware/validation.js`);
    return true;
  }
  
  return false;
}

// Функция для создания файла middleware/errorHandler.js, если его нет
function createErrorHandlerMiddleware() {
  const dirPath = path.join('packages', 'shared', 'middleware');
  const filePath = path.join(dirPath, 'errorHandler.js');
  
  ensureDirectoryExists(dirPath);
  
  if (!fs.existsSync(filePath)) {
    const content = `/**
 * Модуль для обработки ошибок
 * @module @vhm24/shared/middleware/errorHandler
 */

/**
 * Создает middleware для обработки ошибок
 * @param {Object} options - Опции для обработчика ошибок
 * @param {boolean} options.logErrors - Логировать ли ошибки
 * @param {boolean} options.includeErrorStack - Включать ли стек ошибки в ответ (только для development)
 * @returns {Function} Middleware функция для fastify
 */
function createErrorHandler(options = {}) {
  const { 
    logErrors = true, 
    includeErrorStack = process.env.NODE_ENV !== 'production' 
  } = options;
  
  return function errorHandler(error, request, reply) {
    // Логируем ошибку, если включено логирование
    if (logErrors) {
      request.log.error({
        err: error,
        request: {
          method: request.method,
          url: request.url,
          headers: request.headers,
          params: request.params,
          query: request.query,
          body: request.body
        }
      }, 'Request error');
    }
    
    // Определяем статус код ошибки
    const statusCode = error.statusCode || 500;
    
    // Формируем ответ
    const response = {
      statusCode,
      error: error.name || 'Internal Server Error',
      message: error.message || 'An unexpected error occurred'
    };
    
    // Добавляем стек ошибки, если включено
    if (includeErrorStack && error.stack) {
      response.stack = error.stack;
    }
    
    // Добавляем дополнительные данные, если они есть
    if (error.data) {
      response.data = error.data;
    }
    
    // Отправляем ответ
    reply.code(statusCode).send(response);
  };
}

/**
 * Создает ошибку с указанным статус кодом и сообщением
 * @param {number} statusCode - HTTP статус код
 * @param {string} message - Сообщение об ошибке
 * @param {Object} data - Дополнительные данные
 * @returns {Error} Ошибка с указанными параметрами
 */
function createError(statusCode, message, data = null) {
  const error = new Error(message);
  error.statusCode = statusCode;
  
  if (data) {
    error.data = data;
  }
  
  return error;
}

// Предопределенные ошибки
const errors = {
  badRequest: (message = 'Bad Request', data = null) => createError(400, message, data),
  unauthorized: (message = 'Unauthorized', data = null) => createError(401, message, data),
  forbidden: (message = 'Forbidden', data = null) => createError(403, message, data),
  notFound: (message = 'Not Found', data = null) => createError(404, message, data),
  methodNotAllowed: (message = 'Method Not Allowed', data = null) => createError(405, message, data),
  conflict: (message = 'Conflict', data = null) => createError(409, message, data),
  unprocessableEntity: (message = 'Unprocessable Entity', data = null) => createError(422, message, data),
  tooManyRequests: (message = 'Too Many Requests', data = null) => createError(429, message, data),
  internalServerError: (message = 'Internal Server Error', data = null) => createError(500, message, data),
  notImplemented: (message = 'Not Implemented', data = null) => createError(501, message, data),
  badGateway: (message = 'Bad Gateway', data = null) => createError(502, message, data),
  serviceUnavailable: (message = 'Service Unavailable', data = null) => createError(503, message, data),
  gatewayTimeout: (message = 'Gateway Timeout', data = null) => createError(504, message, data)
};

module.exports = {
  createErrorHandler,
  createError,
  errors
};
`;
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Создан файл middleware/errorHandler.js`);
    return true;
  }
  
  return false;
}

// Функция для добавления обработчика ошибок в сервис
function addErrorHandler(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ Файл не найден: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Проверяем, есть ли уже обработчик ошибок
  if (content.includes('errorHandler') && content.includes('setErrorHandler')) {
    return false;
  }
  
  let modified = false;
  
  // Добавляем импорт обработчика ошибок, если его нет
  if (!content.includes('require(\'@vhm24/shared/middleware/errorHandler\')') && 
      !content.includes('require("@vhm24/shared/middleware/errorHandler")')) {
    
    // Находим первую строку с require или const
    const requireRegex = /(const|let|var)\s+.*\s*=\s*require\s*\(['"]/;
    const requireMatch = content.match(requireRegex);
    
    if (requireMatch) {
      const index = requireMatch.index;
      content = content.substring(0, index) + 
                "const { createErrorHandler, errors } = require('@vhm24/shared/middleware/errorHandler');\n" + 
                content.substring(index);
      modified = true;
    } else {
      // Если нет require, добавляем в начало файла
      content = "const { createErrorHandler, errors } = require('@vhm24/shared/middleware/errorHandler');\n" + content;
      modified = true;
    }
  }
  
  // Добавляем обработчик ошибок
  if (!content.includes('setErrorHandler')) {
    // Находим место после fastify.register
    const registerRegex = /fastify\.register\([^)]+\);/g;
    let lastRegisterIndex = 0;
    let match;
    
    while ((match = registerRegex.exec(content)) !== null) {
      lastRegisterIndex = match.index + match[0].length;
    }
    
    if (lastRegisterIndex > 0) {
      const errorHandlerCode = `

// Глобальный обработчик ошибок
fastify.setErrorHandler(createErrorHandler({
  logErrors: true,
  includeErrorStack: process.env.NODE_ENV !== 'production'
}));
`;
      
      content = content.substring(0, lastRegisterIndex) + 
                errorHandlerCode + 
                content.substring(lastRegisterIndex);
      modified = true;
    }
  }
  
  // Заменяем reply.send(err) на безопасные обработчики
  const errorSendRegex = /reply\.send\s*\(\s*err\s*\)/g;
  if (errorSendRegex.test(content)) {
    content = content.replace(errorSendRegex, 'reply.send(errors.internalServerError("An error occurred"))');
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Добавлен обработчик ошибок в ${filePath}`);
    return true;
  }
  
  return false;
}

// Функция для создания скрипта для мониторинга
function createMonitoringScript() {
  const filePath = path.join('scripts', 'monitoring.js');
  
  if (!fs.existsSync(filePath)) {
    const content = `const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Конфигурация сервисов
const services = [
  { name: 'auth', port: 8000, endpoint: '/health' },
  { name: 'inventory', port: 8001, endpoint: '/health' },
  { name: 'machines', port: 8002, endpoint: '/health' },
  { name: 'warehouse', port: 8003, endpoint: '/health' },
  { name: 'tasks', port: 8004, endpoint: '/health' },
  { name: 'data-import', port: 3009, endpoint: '/health' },
  { name: 'gateway', port: 3000, endpoint: '/health' }
];

// Константы
const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'monitoring.log');
const CHECK_INTERVAL = 60000; // 1 минута
const RESTART_ATTEMPTS = 3;

// Создаем директорию для логов, если она не существует
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Функция для логирования
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = \`[\${timestamp}] \${message}\\n\`;
  
  console.log(logMessage.trim());
  fs.appendFileSync(LOG_FILE, logMessage);
}

// Функция для проверки здоровья сервиса
async function checkServiceHealth(service) {
  const { name, port, endpoint } = service;
  const url = \`http://localhost:\${port}\${endpoint}\`;
  
  try {
    const response = await axios.get(url, { timeout: 5000 });
    
    if (response.status === 200) {
      log(\`✅ Сервис \${name} работает нормально\`);
      return true;
    } else {
      log(\`⚠️ Сервис \${name} вернул статус \${response.status}\`);
      return false;
    }
  } catch (error) {
    log(\`❌ Сервис \${name} недоступен: \${error.message}\`);
    return false;
  }
}

// Функция для перезапуска сервиса
function restartService(service) {
  const { name } = service;
  
  log(\`🔄 Перезапуск сервиса \${name}...\`);
  
  try {
    // Находим PID процесса
    let pid;
    
    if (process.platform === 'win32') {
      const output = execSync(\`netstat -ano | findstr :\${service.port}\`).toString();
      const lines = output.split('\\n');
      
      for (const line of lines) {
        const parts = line.trim().split(/\\s+/);
        if (parts.length > 4 && parts[1].includes(':' + service.port)) {
          pid = parts[4];
          break;
        }
      }
    } else {
      pid = execSync(\`lsof -t -i:\${service.port}\`).toString().trim();
    }
    
    if (pid) {
      // Убиваем процесс
      if (process.platform === 'win32') {
        execSync(\`taskkill /F
