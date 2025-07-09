const incompleteDataService = require('../services/incompleteDataService');

async function incompleteDataRoutes(fastify, options) {
  // Получение отчета по незаполненным данным
  fastify.get('/', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          entity: { type: 'string' },
          status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'IGNORED', 'EXPIRED'] },
          completionRateMin: { type: 'number', minimum: 0, maximum: 100 },
          completionRateMax: { type: 'number', minimum: 0, maximum: 100 },
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
        entity: request.query.entity,
        status: request.query.status,
        completionRateMin: request.query.completionRateMin,
        completionRateMax: request.query.completionRateMax,
        dateFrom: request.query.dateFrom,
        dateTo: request.query.dateTo
      };

      const pagination = {
        page: request.query.page,
        limit: request.query.limit
      };

      const result = await incompleteDataService.getIncompleteDataReport(filters, pagination);
      return result;
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  // Получение статистики по незаполненным данным
  fastify.get('/stats', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const stats = await incompleteDataService.getIncompleteDataStats();
      return stats;
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  // Получение детальной информации о незаполненной записи
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const details = await incompleteDataService.getIncompleteDataDetails(id);
      return details;
    } catch (error) {
      if (error.message === 'Запись не найдена') {
        reply.code(404).send({ error: error.message });
      } else {
        reply.code(500).send({ error: error.message });
      }
    }
  });

  // Обновление статуса незаполненной записи
  fastify.put('/:id/status', {
    preHandler: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'IGNORED', 'EXPIRED'] }
        },
        required: ['status']
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { status } = request.body;
      
      const updatedRecord = await incompleteDataService.updateIncompleteDataStatus(
        id,
        status,
        request.user.id
      );
      
      return updatedRecord;
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  // Получение рекомендаций по заполнению данных
  fastify.get('/recommendations/:entity/:entityId', {
    preHandler: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        properties: {
          entity: { type: 'string' },
          entityId: { type: 'string' }
        },
        required: ['entity', 'entityId']
      }
    }
  }, async (request, reply) => {
    try {
      const { entity, entityId } = request.params;
      const recommendations = await incompleteDataService.getCompletionRecommendations(entity, entityId);
      return recommendations;
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  // Отправка напоминаний (только для администраторов)
  fastify.post('/send-reminders', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          force: { type: 'boolean', default: false }
        }
      }
    }
  }, async (request, reply) => {
    try {
      // Проверяем права администратора или менеджера
      if (!request.user.roles.includes('ADMIN') && !request.user.roles.includes('MANAGER')) {
        return reply.code(403).send({ error: 'Недостаточно прав' });
      }

      const reminders = await incompleteDataService.sendReminders();
      
      // Логируем действие
      const auditService = require('../services/auditService');
      await auditService.logSystemAction({
        userId: request.user.id,
        action: 'INFO',
        entity: 'INCOMPLETE_DATA_REMINDER',
        description: `Отправлено ${reminders.length} напоминаний о незаполненных данных`,
        metadata: { reminderCount: reminders.length },
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']
      });

      return {
        success: true,
        remindersSent: reminders.length,
        reminders
      };
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  // Обработка незаполненных данных (cron задача, только для администраторов)
  fastify.post('/process', {
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

      const result = await incompleteDataService.processIncompleteData();
      
      // Логируем действие
      const auditService = require('../services/auditService');
      await auditService.logSystemAction({
        userId: request.user.id,
        action: 'MAINTENANCE',
        entity: 'INCOMPLETE_DATA_LOG',
        description: 'Выполнена обработка незаполненных данных',
        metadata: result,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']
      });

      return result;
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  // Получение незаполненных данных для конкретного пользователя
  fastify.get('/user/:userId', {
    preHandler: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        properties: {
          userId: { type: 'string' }
        },
        required: ['userId']
      },
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'IGNORED', 'EXPIRED'] },
          entity: { type: 'string' },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { userId } = request.params;
      
      // Проверяем права: пользователь может видеть только свои данные, 
      // администраторы и менеджеры - любые
      if (request.user.id !== userId && 
          !request.user.roles.includes('ADMIN') && 
          !request.user.roles.includes('MANAGER')) {
        return reply.code(403).send({ error: 'Недостаточно прав' });
      }

      const filters = {
        userId,
        status: request.query.status,
        entity: request.query.entity
      };

      const pagination = {
        page: request.query.page,
        limit: request.query.limit
      };

      const result = await incompleteDataService.getIncompleteDataReport(filters, pagination);
      return result;
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  // Получение сводки по незаполненным данным для дашборда
  fastify.get('/dashboard/summary', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const stats = await incompleteDataService.getIncompleteDataStats();
      
      // Получаем топ пользователей с незаполненными данными
      const topUsers = stats.byUser.slice(0, 5);
      
      // Получаем топ сущностей с проблемами
      const topEntities = stats.byEntity.slice(0, 5);
      
      // Получаем критические случаи (очень низкий процент заполнения)
      const criticalCases = await incompleteDataService.getIncompleteDataReport(
        { completionRateMax: 30, status: 'PENDING' },
        { page: 1, limit: 10 }
      );

      return {
        summary: {
          totalIncomplete: stats.totalIncomplete,
          avgCompletionRate: stats.avgCompletionRate,
          criticalCount: criticalCases.pagination.total
        },
        topUsers,
        topEntities,
        criticalCases: criticalCases.incompleteData,
        statusDistribution: stats.byStatus
      };
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  // Массовое обновление статуса
  fastify.put('/bulk-update-status', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          ids: { 
            type: 'array', 
            items: { type: 'string' },
            minItems: 1,
            maxItems: 100
          },
          status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'IGNORED', 'EXPIRED'] }
        },
        required: ['ids', 'status']
      }
    }
  }, async (request, reply) => {
    try {
      // Проверяем права администратора или менеджера
      if (!request.user.roles.includes('ADMIN') && !request.user.roles.includes('MANAGER')) {
        return reply.code(403).send({ error: 'Недостаточно прав' });
      }

      const { ids, status } = request.body;
      const results = [];
      
      for (const id of ids) {
        try {
          const updatedRecord = await incompleteDataService.updateIncompleteDataStatus(
            id,
            status,
            request.user.id
          );
          results.push({ id, success: true, record: updatedRecord });
        } catch (error) {
          results.push({ id, success: false, error: error.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      
      // Логируем массовое обновление
      const auditService = require('../services/auditService');
      await auditService.logSystemAction({
        userId: request.user.id,
        action: 'UPDATE',
        entity: 'INCOMPLETE_DATA_LOG',
        description: `Массовое обновление статуса: ${successCount} из ${ids.length} записей`,
        metadata: { 
          totalRecords: ids.length,
          successCount,
          newStatus: status
        },
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']
      });

      return {
        success: true,
        totalProcessed: ids.length,
        successCount,
        results
      };
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });
}

module.exports = incompleteDataRoutes;
