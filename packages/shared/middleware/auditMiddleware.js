const axios = require('axios');

/**
 * Middleware для автоматического логирования действий пользователей
 */
class AuditMiddleware {
  constructor(auditServiceUrl = process.env.AUDIT_SERVICE_URL || 'http://localhost:3009') {
    this.auditServiceUrl = auditServiceUrl;
  }

  /**
   * Middleware для Fastify
   */
  fastifyMiddleware() {
    return async (request, reply) => {
      const startTime = Date.now();
      
      // Генерируем уникальный ID сессии если его нет
      if (!request.headers['x-session-id']) {
        request.headers['x-session-id'] = this.generateSessionId();
      }

      // Логируем запрос
      await this.logRequest(request);

      // Перехватываем ответ
      reply.addHook('onSend', async (request, reply, payload) => {
        const responseTime = Date.now() - startTime;
        await this.logResponse(request, reply, responseTime);
        return payload;
      });
    };
  }

  /**
   * Логирование запроса
   */
  async logRequest(request) {
    try {
      const logData = {
        userId: request.user?.id || null,
        sessionId: request.headers['x-session-id'],
        action: this.getActionFromMethod(request.method),
        entity: this.getEntityFromUrl(request.url),
        entityId: this.getEntityIdFromUrl(request.url),
        description: `${request.method} ${request.url}`,
        inputData: this.sanitizeInputData(request),
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        endpoint: request.url,
        method: request.method
      };

      await this.sendToAuditService('/api/audit/log', logData);
    } catch (error) {
      console.error('Ошибка при логировании запроса:', error);
    }
  }

  /**
   * Логирование ответа
   */
  async logResponse(request, reply, responseTime) {
    try {
      const logData = {
        userId: request.user?.id || null,
        sessionId: request.headers['x-session-id'],
        action: 'INFO',
        entity: 'API_RESPONSE',
        description: `Response for ${request.method} ${request.url}`,
        metadata: {
          statusCode: reply.statusCode,
          responseTime
        },
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        endpoint: request.url,
        method: request.method,
        statusCode: reply.statusCode,
        responseTime
      };

      await this.sendToAuditService('/api/audit/log', logData);
    } catch (error) {
      console.error('Ошибка при логировании ответа:', error);
    }
  }

  /**
   * Логирование изменений данных
   */
  async logDataChange(userId, entity, entityId, oldData, newData, action = 'UPDATE') {
    try {
      const logData = {
        entity,
        entityId,
        oldData,
        newData,
        action
      };

      await this.sendToAuditService('/api/audit/log-data-change', logData, {
        'Authorization': `Bearer ${this.getUserToken(userId)}`,
        'x-user-id': userId
      });
    } catch (error) {
      console.error('Ошибка при логировании изменений данных:', error);
    }
  }

  /**
   * Логирование входа пользователя
   */
  async logUserLogin(userId, sessionId, ipAddress, userAgent) {
    try {
      const logData = {
        sessionId
      };

      await this.sendToAuditService('/api/audit/log-login', logData, {
        'Authorization': `Bearer ${this.getUserToken(userId)}`,
        'x-user-id': userId,
        'x-forwarded-for': ipAddress,
        'user-agent': userAgent
      });
    } catch (error) {
      console.error('Ошибка при логировании входа пользователя:', error);
    }
  }

  /**
   * Логирование выхода пользователя
   */
  async logUserLogout(userId, sessionId) {
    try {
      const logData = {
        sessionId
      };

      await this.sendToAuditService('/api/audit/log-logout', logData, {
        'Authorization': `Bearer ${this.getUserToken(userId)}`,
        'x-user-id': userId
      });
    } catch (error) {
      console.error('Ошибка при логировании выхода пользователя:', error);
    }
  }

  /**
   * Валидация данных
   */
  async validateField(userId, entity, entityId, fieldName, fieldValue, validationType) {
    try {
      const validationData = {
        entity,
        entityId,
        fieldName,
        fieldValue,
        validationType
      };

      const response = await this.sendToAuditService('/api/audit/validate', validationData, {
        'Authorization': `Bearer ${this.getUserToken(userId)}`,
        'x-user-id': userId
      });

      return response.data;
    } catch (error) {
      console.error('Ошибка при валидации данных:', error);
      return { isValid: false, errorMessage: 'Ошибка валидации' };
    }
  }

  /**
   * Получение действия из HTTP метода
   */
  getActionFromMethod(method) {
    const methodMap = {
      'GET': 'READ',
      'POST': 'CREATE',
      'PUT': 'UPDATE',
      'PATCH': 'UPDATE',
      'DELETE': 'DELETE'
    };
    return methodMap[method] || 'READ';
  }

  /**
   * Получение сущности из URL
   */
  getEntityFromUrl(url) {
    const pathParts = url.split('/').filter(part => part && !part.includes('?'));
    
    // Пропускаем /api и берем следующую часть как сущность
    const apiIndex = pathParts.indexOf('api');
    if (apiIndex !== -1 && pathParts.length > apiIndex + 1) {
      return pathParts[apiIndex + 1].toUpperCase();
    }
    
    // Если нет /api, берем первую часть
    return pathParts[0] ? pathParts[0].toUpperCase() : 'UNKNOWN';
  }

  /**
   * Получение ID сущности из URL
   */
  getEntityIdFromUrl(url) {
    const pathParts = url.split('/').filter(part => part && !part.includes('?'));
    
    // Ищем UUID или числовой ID в URL
    for (const part of pathParts) {
      if (this.isValidId(part)) {
        return part;
      }
    }
    
    return null;
  }

  /**
   * Проверка валидности ID
   */
  isValidId(str) {
    // UUID pattern
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    // Числовой ID
    const numericPattern = /^\d+$/;
    // CUID pattern
    const cuidPattern = /^c[a-z0-9]{24}$/i;
    
    return uuidPattern.test(str) || numericPattern.test(str) || cuidPattern.test(str);
  }

  /**
   * Очистка входных данных от чувствительной информации
   */
  sanitizeInputData(request) {
    const sensitiveFields = ['password', 'passwordHash', 'token', 'secret', 'key'];
    const data = {
      params: request.params,
      query: request.query,
      body: request.method !== 'GET' ? request.body : undefined
    };

    return this.removeSensitiveFields(data, sensitiveFields);
  }

  /**
   * Удаление чувствительных полей из объекта
   */
  removeSensitiveFields(obj, sensitiveFields) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const cleaned = Array.isArray(obj) ? [] : {};

    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        cleaned[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        cleaned[key] = this.removeSensitiveFields(value, sensitiveFields);
      } else {
        cleaned[key] = value;
      }
    }

    return cleaned;
  }

  /**
   * Генерация ID сессии
   */
  generateSessionId() {
    return 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  /**
   * Получение токена пользователя (заглушка)
   */
  getUserToken(userId) {
    // В реальном приложении здесь должна быть логика получения токена
    return process.env.AUDIT_SERVICE_TOKEN || 'audit-service-token';
  }

  /**
   * Отправка данных в сервис аудита
   */
  async sendToAuditService(endpoint, data, headers = {}) {
    try {
      const response = await axios.post(`${this.auditServiceUrl}${endpoint}`, data, {
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        timeout: 5000 // 5 секунд таймаут
      });
      
      return response;
    } catch (error) {
      // Не прерываем основную логику при ошибках аудита
      console.error(`Ошибка отправки в сервис аудита (${endpoint}):`, error.message);
      throw error;
    }
  }

  /**
   * Создание декоратора для автоматического логирования CRUD операций
   */
  createCrudLogger(entity) {
    return {
      /**
       * Логирование создания
       */
      logCreate: async (userId, entityId, data) => {
        await this.logDataChange(userId, entity, entityId, null, data, 'CREATE');
      },

      /**
       * Логирование обновления
       */
      logUpdate: async (userId, entityId, oldData, newData) => {
        await this.logDataChange(userId, entity, entityId, oldData, newData, 'UPDATE');
      },

      /**
       * Логирование удаления
       */
      logDelete: async (userId, entityId, data) => {
        await this.logDataChange(userId, entity, entityId, data, null, 'DELETE');
      }
    };
  }

  /**
   * Middleware для валидации обязательных полей
   */
  createValidationMiddleware(entity, requiredFields) {
    return async (request, reply) => {
      if (!request.user?.id) {
        return; // Пропускаем валидацию для неаутентифицированных пользователей
      }

      const data = request.body;
      const entityId = request.params?.id || 'new';

      for (const field of requiredFields) {
        const value = data?.[field];
        const validation = await this.validateField(
          request.user.id,
          entity,
          entityId,
          field,
          value,
          'REQUIRED'
        );

        if (!validation.isValid) {
          reply.code(400).send({
            error: 'Validation failed',
            field,
            message: validation.errorMessage
          });
          return;
        }
      }
    };
  }
}

module.exports = AuditMiddleware;
