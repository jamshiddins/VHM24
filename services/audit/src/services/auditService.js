const { PrismaClient } = require('@prisma/client');
const moment = require('moment');
const _ = require('lodash');

const prisma = new PrismaClient();

class AuditService {
  /**
   * Логирование системного действия
   */
  async logSystemAction(data) {
    try {
      const auditLog = await prisma.systemAuditLog.create({
        data: {
          userId: data.userId,
          sessionId: data.sessionId,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId,
          description: data.description,
          oldValues: data.oldValues,
          newValues: data.newValues,
          inputData: data.inputData,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          endpoint: data.endpoint,
          method: data.method,
          statusCode: data.statusCode,
          responseTime: data.responseTime,
          errorMessage: data.errorMessage,
          metadata: data.metadata
        }
      });

      return auditLog;
    } catch (error) {
      console.error('Ошибка при логировании системного действия:', error);
      // Не прерываем выполнение основной логики при ошибке логирования
    }
  }

  /**
   * Логирование изменений данных
   */
  async logDataChange(userId, entity, entityId, oldData, newData, action = 'UPDATE') {
    try {
      const changes = this.calculateChanges(oldData, newData);
      
      await this.logSystemAction({
        userId,
        action,
        entity,
        entityId,
        description: `${action} ${entity} ${entityId}`,
        oldValues: oldData,
        newValues: newData,
        metadata: { changes }
      });

      // Проверяем на незаполненные поля
      await this.checkIncompleteData(userId, entity, entityId, newData);

    } catch (error) {
      console.error('Ошибка при логировании изменений данных:', error);
    }
  }

  /**
   * Вычисление изменений между старыми и новыми данными
   */
  calculateChanges(oldData, newData) {
    const changes = {};
    
    if (!oldData && newData) {
      return { type: 'CREATE', data: newData };
    }
    
    if (oldData && !newData) {
      return { type: 'DELETE', data: oldData };
    }

    const allKeys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);
    
    for (const key of allKeys) {
      const oldValue = oldData?.[key];
      const newValue = newData?.[key];
      
      if (!_.isEqual(oldValue, newValue)) {
        changes[key] = {
          from: oldValue,
          to: newValue
        };
      }
    }

    return changes;
  }

  /**
   * Проверка на незаполненные данные
   */
  async checkIncompleteData(userId, entity, entityId, data) {
    try {
      const requiredFields = this.getRequiredFields(entity);
      const missingFields = [];
      const partialData = {};

      for (const field of requiredFields) {
        const value = data?.[field];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          missingFields.push(field);
        } else {
          partialData[field] = value;
        }
      }

      if (missingFields.length > 0) {
        const completionRate = ((requiredFields.length - missingFields.length) / requiredFields.length) * 100;

        await prisma.incompleteDataLog.upsert({
          where: {
            entity_entityId: {
              entity,
              entityId
            }
          },
          update: {
            userId,
            requiredFields,
            missingFields,
            partialData,
            completionRate,
            status: completionRate === 100 ? 'COMPLETED' : 'PENDING',
            completedAt: completionRate === 100 ? new Date() : null,
            updatedAt: new Date()
          },
          create: {
            userId,
            entity,
            entityId,
            requiredFields,
            missingFields,
            partialData,
            completionRate,
            status: completionRate === 100 ? 'COMPLETED' : 'PENDING',
            completedAt: completionRate === 100 ? new Date() : null
          }
        });
      }
    } catch (error) {
      console.error('Ошибка при проверке незаполненных данных:', error);
    }
  }

  /**
   * Получение обязательных полей для сущности
   */
  getRequiredFields(entity) {
    const requiredFieldsMap = {
      'User': ['name', 'email', 'phoneNumber'],
      'Machine': ['code', 'serialNumber', 'type', 'name', 'locationId'],
      'Task': ['title', 'description', 'assignedToId', 'dueDate'],
      'InventoryItem': ['name', 'sku', 'unit', 'category', 'minQuantity'],
      'Location': ['name', 'address'],
      'Route': ['name', 'driverId', 'startTime'],
      'ServiceHistory': ['machineId', 'serviceType', 'description', 'performedById'],
      'StockMovement': ['itemId', 'userId', 'type', 'quantity', 'reason'],
      'Recipe': ['name', 'description'],
      'DriverLog': ['driverId', 'type', 'description']
    };

    return requiredFieldsMap[entity] || [];
  }

  /**
   * Логирование входа пользователя
   */
  async logUserLogin(userId, sessionId, ipAddress, userAgent) {
    try {
      // Создаем сессию пользователя
      await prisma.userSession.create({
        data: {
          userId,
          sessionId,
          ipAddress,
          userAgent,
          loginAt: new Date(),
          lastActivity: new Date(),
          isActive: true
        }
      });

      // Логируем действие
      await this.logSystemAction({
        userId,
        sessionId,
        action: 'LOGIN',
        entity: 'USER_SESSION',
        entityId: userId,
        description: 'Пользователь вошел в систему',
        ipAddress,
        userAgent
      });

      // Обновляем время последнего входа
      await prisma.user.update({
        where: { id: userId },
        data: { lastLogin: new Date() }
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
      // Закрываем сессию
      await prisma.userSession.updateMany({
        where: {
          userId,
          sessionId,
          isActive: true
        },
        data: {
          logoutAt: new Date(),
          isActive: false
        }
      });

      // Логируем действие
      await this.logSystemAction({
        userId,
        sessionId,
        action: 'LOGOUT',
        entity: 'USER_SESSION',
        entityId: userId,
        description: 'Пользователь вышел из системы'
      });

    } catch (error) {
      console.error('Ошибка при логировании выхода пользователя:', error);
    }
  }

  /**
   * Обновление активности пользователя
   */
  async updateUserActivity(userId, sessionId) {
    try {
      await prisma.userSession.updateMany({
        where: {
          userId,
          sessionId,
          isActive: true
        },
        data: {
          lastActivity: new Date()
        }
      });
    } catch (error) {
      console.error('Ошибка при обновлении активности пользователя:', error);
    }
  }

  /**
   * Получение логов аудита с фильтрацией
   */
  async getAuditLogs(filters = {}, pagination = {}) {
    try {
      const {
        userId,
        action,
        entity,
        dateFrom,
        dateTo,
        sessionId
      } = filters;

      const {
        page = 1,
        limit = 50
      } = pagination;

      const where = {};

      if (userId) where.userId = userId;
      if (action) where.action = action;
      if (entity) where.entity = entity;
      if (sessionId) where.sessionId = sessionId;
      
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo);
      }

      const [logs, total] = await Promise.all([
        prisma.systemAuditLog.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.systemAuditLog.count({ where })
      ]);

      return {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      console.error('Ошибка при получении логов аудита:', error);
      throw error;
    }
  }

  /**
   * Получение статистики активности пользователей
   */
  async getUserActivityStats(dateFrom, dateTo) {
    try {
      const where = {
        createdAt: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo)
        }
      };

      const [totalActions, userActions, topActions, topEntities] = await Promise.all([
        // Общее количество действий
        prisma.systemAuditLog.count({ where }),
        
        // Действия по пользователям
        prisma.systemAuditLog.groupBy({
          by: ['userId'],
          where,
          _count: {
            id: true
          },
          orderBy: {
            _count: {
              id: 'desc'
            }
          },
          take: 10
        }),
        
        // Топ действий
        prisma.systemAuditLog.groupBy({
          by: ['action'],
          where,
          _count: {
            id: true
          },
          orderBy: {
            _count: {
              id: 'desc'
            }
          },
          take: 10
        }),
        
        // Топ сущностей
        prisma.systemAuditLog.groupBy({
          by: ['entity'],
          where,
          _count: {
            id: true
          },
          orderBy: {
            _count: {
              id: 'desc'
            }
          },
          take: 10
        })
      ]);

      // Получаем информацию о пользователях
      const userIds = userActions.map(ua => ua.userId).filter(Boolean);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true }
      });

      const userMap = users.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {});

      const userActionsWithNames = userActions.map(ua => ({
        ...ua,
        user: ua.userId ? userMap[ua.userId] : null
      }));

      return {
        totalActions,
        userActions: userActionsWithNames,
        topActions,
        topEntities
      };

    } catch (error) {
      console.error('Ошибка при получении статистики активности:', error);
      throw error;
    }
  }

  /**
   * Очистка старых логов
   */
  async cleanupOldLogs() {
    try {
      const retentionDays = parseInt(process.env.AUDIT_RETENTION_DAYS) || 90;
      const cutoffDate = moment().subtract(retentionDays, 'days').toDate();

      const [deletedAuditLogs, deletedSystemLogs] = await Promise.all([
        prisma.auditLog.deleteMany({
          where: {
            createdAt: {
              lt: cutoffDate
            }
          }
        }),
        prisma.systemAuditLog.deleteMany({
          where: {
            createdAt: {
              lt: cutoffDate
            }
          }
        })
      ]);

      console.log(`Очищено ${deletedAuditLogs.count} старых audit логов и ${deletedSystemLogs.count} системных логов`);

      return {
        deletedAuditLogs: deletedAuditLogs.count,
        deletedSystemLogs: deletedSystemLogs.count
      };

    } catch (error) {
      console.error('Ошибка при очистке старых логов:', error);
      throw error;
    }
  }

  /**
   * Валидация данных
   */
  async validateData(userId, entity, entityId, fieldName, fieldValue, validationType) {
    try {
      let isValid = true;
      let errorMessage = null;

      switch (validationType) {
        case 'REQUIRED':
          isValid = fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
          if (!isValid) errorMessage = 'Поле обязательно для заполнения';
          break;
          
        case 'FORMAT':
          // Проверка формата email
          if (fieldName === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            isValid = emailRegex.test(fieldValue);
            if (!isValid) errorMessage = 'Неверный формат email';
          }
          break;
          
        case 'LENGTH':
          if (typeof fieldValue === 'string') {
            isValid = fieldValue.length >= 3 && fieldValue.length <= 255;
            if (!isValid) errorMessage = 'Длина должна быть от 3 до 255 символов';
          }
          break;
          
        case 'UNIQUE':
          // Проверка уникальности (упрощенная)
          if (entity === 'User' && fieldName === 'email') {
            const existingUser = await prisma.user.findFirst({
              where: {
                email: fieldValue,
                id: { not: entityId }
              }
            });
            isValid = !existingUser;
            if (!isValid) errorMessage = 'Email уже используется';
          }
          break;
      }

      // Логируем результат валидации
      await prisma.dataValidationLog.create({
        data: {
          userId,
          entity,
          entityId,
          fieldName,
          fieldValue: String(fieldValue),
          validationType,
          isValid,
          errorMessage,
          severity: isValid ? 'INFO' : 'ERROR'
        }
      });

      return { isValid, errorMessage };

    } catch (error) {
      console.error('Ошибка при валидации данных:', error);
      return { isValid: false, errorMessage: 'Ошибка валидации' };
    }
  }
}

module.exports = new AuditService();
