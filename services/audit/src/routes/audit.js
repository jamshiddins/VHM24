const auditService = require('../services/auditService');

async function auditRoutes(fastify, options) {
  // Получение логов аудита
  fastify.get('/logs', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          action: { type: 'string' },
          entity: { type: 'string' },
          sessionId: { type: 'string' },
          dateFrom: { type: 'string', format: 'date-time' },
          dateTo: { type: 'string', format: 'date-time' },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const filters = {
        userId: request.query.userId,
        action: request.query.action,
        entity: request.query.entity,
        sessionId: request.query.sessionId,
        dateFrom: request.query.dateFrom,
        dateTo: request.query.dateTo
      };

      const pagination = {
        page: request.query.page,
        limit: request.query.limit
      };

      const result = await auditService.getAuditLogs(filters, pagination);
      return result;
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  // Получение статистики активности пользователей
  fastify.get('/stats/activity', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          dateFrom: { type: 'string', format: 'date-time' },
          dateTo: { type: 'string', format: 'date-time' }
        },
        required: ['dateFrom', 'dateTo']
      }
    }
  }, async (request, reply) => {
    try {
      const { dateFrom, dateTo } = request.query;
      const stats = await auditService.getUserActivityStats(dateFrom, dateTo);
      return stats;
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  // Логирование пользовательского действия
  fastify.post('/log', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'APPROVE', 'REJECT', 'ASSIGN', 'COMPLETE', 'CANCEL'] },
          entity: { type: 'string' },
          entityId: { type: 'string' },
          description: { type: 'string' },
          oldValues: { type: 'object' },
          newValues: { type: 'object' },
          metadata: { type: 'object' }
        },
        required: ['action', 'entity', 'description']
      }
    }
  }, async (request, reply) => {
    try {
      const logData = {
        userId: request.user.id,
        sessionId: request.headers['x-session-id'],
        action: request.body.action,
        entity: request.body.entity,
        entityId: request.body.entityId,
        description: request.body.description,
        oldValues: request.body.oldValues,
        newValues: request.body.newValues,
        metadata: request.body.metadata,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']
      };

      const result = await auditService.logSystemAction(logData);
      return { success: true, id: result?.id };
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  // Логирование изменений данных
  fastify.post('/log-data-change', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          entity: { type: 'string' },
          entityId: { type: 'string' },
          oldData: { type: 'object' },
          newData: { type: 'object' },
          action: { type: 'string', default: 'UPDATE' }
        },
        required: ['entity', 'entityId', 'newData']
      }
    }
  }, async (request, reply) => {
    try {
      const { entity, entityId, oldData, newData, action } = request.body;
      
      await auditService.logDataChange(
        request.user.id,
        entity,
        entityId,
        oldData,
        newData,
        action
      );

      return { success: true };
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  // Логирование входа пользователя
  fastify.post('/log-login', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          sessionId: { type: 'string' }
        },
        required: ['sessionId']
      }
    }
  }, async (request, reply) => {
    try {
      const { sessionId } = request.body;
      
      await auditService.logUserLogin(
        request.user.id,
        sessionId,
        request.ip,
        request.headers['user-agent']
      );

      return { success: true };
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  // Логирование выхода пользователя
  fastify.post('/log-logout', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          sessionId: { type: 'string' }
        },
        required: ['sessionId']
      }
    }
  }, async (request, reply) => {
    try {
      const { sessionId } = request.body;
      
      await auditService.logUserLogout(request.user.id, sessionId);
      return { success: true };
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  // Обновление активности пользователя
  fastify.post('/update-activity', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          sessionId: { type: 'string' }
        },
        required: ['sessionId']
      }
    }
  }, async (request, reply) => {
    try {
      const { sessionId } = request.body;
      
      await auditService.updateUserActivity(request.user.id, sessionId);
      return { success: true };
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  // Валидация данных
  fastify.post('/validate', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          entity: { type: 'string' },
          entityId: { type: 'string' },
          fieldName: { type: 'string' },
          fieldValue: {},
          validationType: { type: 'string', enum: ['REQUIRED', 'FORMAT', 'LENGTH', 'RANGE', 'UNIQUE', 'REFERENCE', 'CUSTOM'] }
        },
        required: ['entity', 'fieldName', 'fieldValue', 'validationType']
      }
    }
  }, async (request, reply) => {
    try {
      const { entity, entityId, fieldName, fieldValue, validationType } = request.body;
      
      const result = await auditService.validateData(
        request.user.id,
        entity,
        entityId,
        fieldName,
        fieldValue,
        validationType
      );

      return result;
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  // Очистка старых логов (только для администраторов)
  fastify.post('/cleanup', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          confirm: { type: 'boolean' }
        },
        required: ['confirm']
      }
    }
  }, async (request, reply) => {
    try {
      // Проверяем права администратора
      if (!request.user.roles.includes('ADMIN')) {
        return reply.code(403).send({ error: 'Недостаточно прав' });
      }

      if (!request.body.confirm) {
        return reply.code(400).send({ error: 'Требуется подтверждение' });
      }

      const result = await auditService.cleanupOldLogs();
      
      // Логируем действие очистки
      await auditService.logSystemAction({
        userId: request.user.id,
        action: 'MAINTENANCE',
        entity: 'AUDIT_LOG',
        description: 'Выполнена очистка старых логов аудита',
        metadata: result,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']
      });

      return result;
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });
}

module.exports = auditRoutes;
