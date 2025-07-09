/**
 * VHM24 Validation Middleware
 * JSON Schema валидация для всех endpoints
 */

const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const { sanitizeInput } = require('../../shared-types/src/security');

// Создаем экземпляр AJV с форматами
const ajv = new Ajv({ 
  allErrors: true,
  removeAdditional: true, // Удаляем дополнительные поля
  useDefaults: true, // Используем значения по умолчанию
  coerceTypes: true // Приводим типы автоматически
});
addFormats(ajv);

/**
 * Базовые схемы для переиспользования
 */
const baseSchemas = {
  // ID схемы
  id: {
    type: 'string',
    pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  },
  
  // Email схема
  email: {
    type: 'string',
    format: 'email',
    maxLength: 255
  },
  
  // Телефон схема (Узбекистан)
  phone: {
    type: 'string',
    pattern: '^\\+998\\d{9}$'
  },
  
  // Telegram ID схема
  telegramId: {
    type: 'string',
    pattern: '^\\d+$',
    minLength: 1,
    maxLength: 20
  },
  
  // Пагинация схемы
  pagination: {
    type: 'object',
    properties: {
      page: {
        type: 'integer',
        minimum: 1,
        default: 1
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 100,
        default: 20
      },
      sortBy: {
        type: 'string',
        maxLength: 50
      },
      sortOrder: {
        type: 'string',
        enum: ['asc', 'desc'],
        default: 'desc'
      }
    },
    additionalProperties: false
  },
  
  // Координаты
  coordinates: {
    type: 'object',
    properties: {
      latitude: {
        type: 'number',
        minimum: -90,
        maximum: 90
      },
      longitude: {
        type: 'number',
        minimum: -180,
        maximum: 180
      }
    },
    required: ['latitude', 'longitude'],
    additionalProperties: false
  }
};

/**
 * Схемы для аутентификации
 */
const authSchemas = {
  login: {
    type: 'object',
    properties: {
      email: baseSchemas.email,
      password: {
        type: 'string',
        minLength: 8,
        maxLength: 128
      }
    },
    required: ['email', 'password'],
    additionalProperties: false
  },
  
  register: {
    type: 'object',
    properties: {
      email: baseSchemas.email,
      password: {
        type: 'string',
        minLength: 8,
        maxLength: 128
      },
      firstName: {
        type: 'string',
        minLength: 2,
        maxLength: 50
      },
      lastName: {
        type: 'string',
        minLength: 2,
        maxLength: 50
      },
      phone: baseSchemas.phone,
      telegramId: baseSchemas.telegramId
    },
    required: ['email', 'password', 'firstName', 'lastName'],
    additionalProperties: false
  },
  
  refreshToken: {
    type: 'object',
    properties: {
      refreshToken: {
        type: 'string',
        minLength: 10
      }
    },
    required: ['refreshToken'],
    additionalProperties: false
  }
};

/**
 * Схемы для машин
 */
const machineSchemas = {
  create: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 2,
        maxLength: 100
      },
      location: {
        type: 'string',
        minLength: 5,
        maxLength: 255
      },
      coordinates: baseSchemas.coordinates,
      type: {
        type: 'string',
        enum: ['SNACK', 'DRINK', 'COMBO', 'COFFEE']
      },
      capacity: {
        type: 'integer',
        minimum: 1,
        maximum: 1000
      },
      isActive: {
        type: 'boolean',
        default: true
      }
    },
    required: ['name', 'location', 'coordinates', 'type', 'capacity'],
    additionalProperties: false
  },
  
  update: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 2,
        maxLength: 100
      },
      location: {
        type: 'string',
        minLength: 5,
        maxLength: 255
      },
      coordinates: baseSchemas.coordinates,
      type: {
        type: 'string',
        enum: ['SNACK', 'DRINK', 'COMBO', 'COFFEE']
      },
      capacity: {
        type: 'integer',
        minimum: 1,
        maximum: 1000
      },
      isActive: {
        type: 'boolean'
      }
    },
    additionalProperties: false
  },
  
  list: {
    type: 'object',
    properties: {
      ...baseSchemas.pagination.properties,
      type: {
        type: 'string',
        enum: ['SNACK', 'DRINK', 'COMBO', 'COFFEE']
      },
      isActive: {
        type: 'boolean'
      },
      location: {
        type: 'string',
        maxLength: 255
      }
    },
    additionalProperties: false
  }
};

/**
 * Схемы для инвентаря
 */
const inventorySchemas = {
  create: {
    type: 'object',
    properties: {
      machineId: baseSchemas.id,
      productName: {
        type: 'string',
        minLength: 2,
        maxLength: 100
      },
      quantity: {
        type: 'integer',
        minimum: 0,
        maximum: 1000
      },
      price: {
        type: 'number',
        minimum: 0,
        maximum: 1000000
      },
      expiryDate: {
        type: 'string',
        format: 'date'
      }
    },
    required: ['machineId', 'productName', 'quantity', 'price'],
    additionalProperties: false
  },
  
  update: {
    type: 'object',
    properties: {
      productName: {
        type: 'string',
        minLength: 2,
        maxLength: 100
      },
      quantity: {
        type: 'integer',
        minimum: 0,
        maximum: 1000
      },
      price: {
        type: 'number',
        minimum: 0,
        maximum: 1000000
      },
      expiryDate: {
        type: 'string',
        format: 'date'
      }
    },
    additionalProperties: false
  },
  
  list: {
    type: 'object',
    properties: {
      ...baseSchemas.pagination.properties,
      machineId: baseSchemas.id,
      productName: {
        type: 'string',
        maxLength: 100
      },
      lowStock: {
        type: 'boolean'
      }
    },
    additionalProperties: false
  }
};

/**
 * Схемы для задач
 */
const taskSchemas = {
  create: {
    type: 'object',
    properties: {
      machineId: baseSchemas.id,
      type: {
        type: 'string',
        enum: ['MAINTENANCE', 'REFILL', 'REPAIR', 'INSPECTION', 'CLEANING']
      },
      priority: {
        type: 'string',
        enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        default: 'MEDIUM'
      },
      description: {
        type: 'string',
        minLength: 10,
        maxLength: 1000
      },
      scheduledFor: {
        type: 'string',
        format: 'date-time'
      },
      assignedTo: baseSchemas.id
    },
    required: ['machineId', 'type', 'description'],
    additionalProperties: false
  },
  
  update: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['MAINTENANCE', 'REFILL', 'REPAIR', 'INSPECTION', 'CLEANING']
      },
      priority: {
        type: 'string',
        enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
      },
      status: {
        type: 'string',
        enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
      },
      description: {
        type: 'string',
        minLength: 10,
        maxLength: 1000
      },
      scheduledFor: {
        type: 'string',
        format: 'date-time'
      },
      assignedTo: baseSchemas.id,
      completedAt: {
        type: 'string',
        format: 'date-time'
      },
      notes: {
        type: 'string',
        maxLength: 2000
      }
    },
    additionalProperties: false
  },
  
  list: {
    type: 'object',
    properties: {
      ...baseSchemas.pagination.properties,
      machineId: baseSchemas.id,
      type: {
        type: 'string',
        enum: ['MAINTENANCE', 'REFILL', 'REPAIR', 'INSPECTION', 'CLEANING']
      },
      status: {
        type: 'string',
        enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
      },
      priority: {
        type: 'string',
        enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
      },
      assignedTo: baseSchemas.id
    },
    additionalProperties: false
  }
};

/**
 * Все схемы в одном объекте
 */
const schemas = {
  auth: authSchemas,
  machine: machineSchemas,
  inventory: inventorySchemas,
  task: taskSchemas,
  base: baseSchemas
};

/**
 * Компилируем все схемы
 */
const compiledSchemas = {};
Object.keys(schemas).forEach(category => {
  compiledSchemas[category] = {};
  Object.keys(schemas[category]).forEach(schemaName => {
    const schemaKey = `${category}.${schemaName}`;
    compiledSchemas[category][schemaName] = ajv.compile(schemas[category][schemaName]);
  });
});

/**
 * Middleware для валидации body
 */
const validateBody = (category, schemaName) => {
  return async (request, reply) => {
    const validator = compiledSchemas[category]?.[schemaName];
    
    if (!validator) {
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Validation schema not found',
        statusCode: 500
      });
    }

    // Санитизируем данные перед валидацией
    if (request.body && typeof request.body === 'object') {
      sanitizeRequestData(request.body);
    }

    const valid = validator(request.body);
    
    if (!valid) {
      const errors = validator.errors.map(err => ({
        field: err.instancePath.replace('/', '') || err.params?.missingProperty || 'root',
        message: err.message,
        value: err.data
      }));

      return reply.code(400).send({
        error: 'Validation Error',
        message: 'Invalid request data',
        statusCode: 400,
        details: errors
      });
    }
  };
};

/**
 * Middleware для валидации query параметров
 */
const validateQuery = (category, schemaName) => {
  return async (request, reply) => {
    const validator = compiledSchemas[category]?.[schemaName];
    
    if (!validator) {
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Validation schema not found',
        statusCode: 500
      });
    }

    // Санитизируем query параметры
    if (request.query) {
      sanitizeRequestData(request.query);
    }

    const valid = validator(request.query);
    
    if (!valid) {
      const errors = validator.errors.map(err => ({
        field: err.instancePath.replace('/', '') || err.params?.missingProperty || 'root',
        message: err.message,
        value: err.data
      }));

      return reply.code(400).send({
        error: 'Validation Error',
        message: 'Invalid query parameters',
        statusCode: 400,
        details: errors
      });
    }
  };
};

/**
 * Middleware для валидации params (URL параметров)
 */
const validateParams = (paramsSchema) => {
  const validator = ajv.compile(paramsSchema);
  
  return async (request, reply) => {
    const valid = validator(request.params);
    
    if (!valid) {
      const errors = validator.errors.map(err => ({
        field: err.instancePath.replace('/', '') || err.params?.missingProperty || 'root',
        message: err.message,
        value: err.data
      }));

      return reply.code(400).send({
        error: 'Validation Error',
        message: 'Invalid URL parameters',
        statusCode: 400,
        details: errors
      });
    }
  };
};

/**
 * Универсальный валидатор ID параметра
 */
const validateId = validateParams({
  type: 'object',
  properties: {
    id: baseSchemas.id
  },
  required: ['id'],
  additionalProperties: false
});

/**
 * Санитизация данных запроса
 */
function sanitizeRequestData(data) {
  if (typeof data !== 'object' || data === null) return;
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      data[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitizeRequestData(value);
    }
  }
}

/**
 * Создание кастомного валидатора
 */
const createValidator = (schema) => {
  const validator = ajv.compile(schema);
  
  return async (request, reply) => {
    const dataToValidate = {
      ...request.body,
      ...request.query,
      ...request.params
    };

    // Санитизируем данные
    sanitizeRequestData(dataToValidate);

    const valid = validator(dataToValidate);
    
    if (!valid) {
      const errors = validator.errors.map(err => ({
        field: err.instancePath.replace('/', '') || err.params?.missingProperty || 'root',
        message: err.message,
        value: err.data
      }));

      return reply.code(400).send({
        error: 'Validation Error',
        message: 'Invalid request data',
        statusCode: 400,
        details: errors
      });
    }
  };
};

/**
 * Валидация файлов
 */
const validateFile = (options = {}) => {
  const {
    required = false,
    maxSize = 5 * 1024 * 1024, // 5MB по умолчанию
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
  } = options;

  return async (request, reply) => {
    const file = request.file;

    if (required && !file) {
      return reply.code(400).send({
        error: 'Validation Error',
        message: 'File is required',
        statusCode: 400
      });
    }

    if (file) {
      // Проверяем размер файла
      if (file.size > maxSize) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: `File size exceeds limit of ${Math.round(maxSize / 1024 / 1024)}MB`,
          statusCode: 400
        });
      }

      // Проверяем тип файла
      if (!allowedTypes.includes(file.mimetype)) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: `File type ${file.mimetype} is not allowed`,
          statusCode: 400,
          allowedTypes
        });
      }
    }
  };
};

module.exports = {
  schemas,
  validateBody,
  validateQuery,
  validateParams,
  validateId,
  validateFile,
  createValidator,
  compiledSchemas
};
