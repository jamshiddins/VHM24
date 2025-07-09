const auditService = require('../services/auditService');
const incompleteDataService = require('../services/incompleteDataService');

async function reportsRoutes(fastify, options) {
  // Общий отчет по активности системы
  fastify.get('/system-activity', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          dateFrom: { type: 'string', format: 'date-time' },
          dateTo: { type: 'string', format: 'date-time' },
          groupBy: { type: 'string', enum: ['hour', 'day', 'week', 'month'], default: 'day' }
        },
        required: ['dateFrom', 'dateTo']
      }
    }
  }, async (request, reply) => {
    try {
      const { dateFrom, dateTo, groupBy } = request.query;
      
      // Получаем базовую статистику
      const stats = await auditService.getUserActivityStats(dateFrom, dateTo);
      
      // Получаем статистику по незаполненным данным
      const incompleteStats = await incompleteDataService.getIncompleteDataStats();
      
      return {
        period: { dateFrom, dateTo, groupBy },
        activity: stats,
        incompleteData: incompleteStats,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  // Отчет по пользователям
  fastify.get('/users', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          dateFrom: { type: 'string', format: 'date-time' },
          dateTo: { type: 'string', format: 'date-time' },
          userId: { type: 'string' },
          includeInactive: { type: 'boolean', default: false }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { dateFrom, dateTo, userId, includeInactive } = request.query;
      
      const filters = {};
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;
      if (userId) filters.userId = userId;

      // Получаем логи активности
      const activityLogs = await auditService.getAuditLogs(filters, { page: 1, limit: 1000 });
      
      // Получаем незаполненные данные по пользователям
      const incompleteData = await incompleteDataService.getIncompleteDataReport(
        { userId, status: 'PENDING' },
        { page: 1, limit: 100 }
      );

      // Группируем данные по пользователям
      const userReport = {};
      
      for (const log of activityLogs.logs) {
        if (!log.userId) continue;
        
        if (!userReport[log.userId]) {
          userReport[log.userId] = {
            user: log.user,
            totalActions: 0,
            actionsByType: {},
            lastActivity: null,
            incompleteDataCount: 0
          };
        }
        
        userReport[log.userId].totalActions++;
        userReport[log.userId].actionsByType[log.action] = 
          (userReport[log.userId].actionsByType[log.action] || 0) + 1;
        
        if (!userReport[log.userId].lastActivity || 
            new Date(log.createdAt) > new Date(userReport[log.userId].lastActivity)) {
          userReport[log.userId].lastActivity = log.createdAt;
        }
      }

      // Добавляем информацию о незаполненных данных
      for (const incomplete of incompleteData.incompleteData) {
        if (incomplete.userId && userReport[incomplete.userId]) {
          userReport[incomplete.userId].incompleteDataCount++;
        }
      }

      return {
        period: { dateFrom, dateTo },
        users: Object.values(userReport),
        summary: {
          totalUsers: Object.keys(userReport).length,
          totalActions: activityLogs.pagination.total,
          totalIncompleteData: incompleteData.pagination.total
        },
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  // Отчет по сущностям
  fastify.get('/entities', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          dateFrom: { type: 'string', format: 'date-time' },
          dateTo: { type: 'string', format: 'date-time' },
          entity: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { dateFrom, dateTo, entity } = request.query;
      
      const filters = {};
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;
      if (entity) filters.entity = entity;

      // Получаем логи по сущностям
      const entityLogs = await auditService.getAuditLogs(filters, { page: 1, limit: 1000 });
      
      // Группируем по сущностям
      const entityReport = {};
      
      for (const log of entityLogs.logs) {
        if (!entityReport[log.entity]) {
          entityReport[log.entity] = {
            entity: log.entity,
            totalActions: 0,
            actionsByType: {},
            uniqueEntities: new Set(),
            lastActivity: null
          };
        }
        
        entityReport[log.entity].totalActions++;
        entityReport[log.entity].actionsByType[log.action] = 
          (entityReport[log.entity].actionsByType[log.action] || 0) + 1;
        
        if (log.entityId) {
          entityReport[log.entity].uniqueEntities.add(log.entityId);
        }
        
        if (!entityReport[log.entity].lastActivity || 
            new Date(log.createdAt) > new Date(entityReport[log.entity].lastActivity)) {
          entityReport[log.entity].lastActivity = log.createdAt;
        }
      }

      // Преобразуем Set в число
      Object.values(entityReport).forEach(report => {
        report.uniqueEntitiesCount = report.uniqueEntities.size;
        delete report.uniqueEntities;
      });

      return {
        period: { dateFrom, dateTo },
        entities: Object.values(entityReport),
        summary: {
          totalEntities: Object.keys(entityReport).length,
          totalActions: entityLogs.pagination.total
        },
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  // Отчет по ошибкам и проблемам
  fastify.get('/errors', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          dateFrom: { type: 'string', format: 'date-time' },
          dateTo: { type: 'string', format: 'date-time' },
          severity: { type: 'string', enum: ['INFO', 'WARNING', 'ERROR', 'CRITICAL'] }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { dateFrom, dateTo, severity } = request.query;
      
      const filters = {
        action: 'ERROR'
      };
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;

      // Получаем логи ошибок
      const errorLogs = await auditService.getAuditLogs(filters, { page: 1, limit: 500 });
      
      // Получаем логи валидации с ошибками
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const validationWhere = {
        isValid: false
      };
      if (severity) validationWhere.severity = severity;
      if (dateFrom) validationWhere.createdAt = { gte: new Date(dateFrom) };
      if (dateTo) {
        if (validationWhere.createdAt) {
          validationWhere.createdAt.lte = new Date(dateTo);
        } else {
          validationWhere.createdAt = { lte: new Date(dateTo) };
        }
      }

      const validationErrors = await prisma.dataValidationLog.findMany({
        where: validationWhere,
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 200
      });

      // Группируем ошибки
      const errorsByType = {};
      const errorsByEntity = {};
      
      for (const error of errorLogs.logs) {
        const errorType = error.metadata?.errorType || 'SYSTEM_ERROR';
        errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
        errorsByEntity[error.entity] = (errorsByEntity[error.entity] || 0) + 1;
      }

      const validationErrorsByField = {};
      const validationErrorsBySeverity = {};
      
      for (const error of validationErrors) {
        const key = `${error.entity}.${error.fieldName}`;
        validationErrorsByField[key] = (validationErrorsByField[key] || 0) + 1;
        validationErrorsBySeverity[error.severity] = (validationErrorsBySeverity[error.severity] || 0) + 1;
      }

      return {
        period: { dateFrom, dateTo },
        systemErrors: {
          total: errorLogs.pagination.total,
          byType: errorsByType,
          byEntity: errorsByEntity,
          recent: errorLogs.logs.slice(0, 10)
        },
        validationErrors: {
          total: validationErrors.length,
          byField: validationErrorsByField,
          bySeverity: validationErrorsBySeverity,
          recent: validationErrors.slice(0, 10)
        },
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  // Экспорт отчета в CSV
  fastify.get('/export/:reportType', {
    preHandler: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        properties: {
          reportType: { type: 'string', enum: ['audit-logs', 'incomplete-data', 'user-activity'] }
        },
        required: ['reportType']
      },
      querystring: {
        type: 'object',
        properties: {
          dateFrom: { type: 'string', format: 'date-time' },
          dateTo: { type: 'string', format: 'date-time' },
          format: { type: 'string', enum: ['csv', 'json'], default: 'csv' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { reportType } = request.params;
      const { dateFrom, dateTo, format } = request.query;
      
      let data;
      let filename;
      
      switch (reportType) {
        case 'audit-logs':
          const auditData = await auditService.getAuditLogs(
            { dateFrom, dateTo },
            { page: 1, limit: 10000 }
          );
          data = auditData.logs;
          filename = `audit-logs-${new Date().toISOString().split('T')[0]}`;
          break;
          
        case 'incomplete-data':
          const incompleteData = await incompleteDataService.getIncompleteDataReport(
            { dateFrom, dateTo },
            { page: 1, limit: 10000 }
          );
          data = incompleteData.incompleteData;
          filename = `incomplete-data-${new Date().toISOString().split('T')[0]}`;
          break;
          
        case 'user-activity':
          const activityStats = await auditService.getUserActivityStats(
            dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            dateTo || new Date().toISOString()
          );
          data = activityStats.userActions;
          filename = `user-activity-${new Date().toISOString().split('T')[0]}`;
          break;
          
        default:
          return reply.code(400).send({ error: 'Неподдерживаемый тип отчета' });
      }

      if (format === 'json') {
        reply.header('Content-Type', 'application/json');
        reply.header('Content-Disposition', `attachment; filename="${filename}.json"`);
        return data;
      } else {
        // Простая CSV генерация
        const csvData = convertToCSV(data);
        reply.header('Content-Type', 'text/csv');
        reply.header('Content-Disposition', `attachment; filename="${filename}.csv"`);
        return csvData;
      }
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });
}

// Вспомогательная функция для конвертации в CSV
function convertToCSV(data) {
  if (!data || data.length === 0) {
    return '';
  }
  
  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  // Добавляем заголовки
  csvRows.push(headers.join(','));
  
  // Добавляем данные
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) {
        return '';
      }
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

module.exports = reportsRoutes;
