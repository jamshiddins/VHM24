const { PrismaClient } = require('@prisma/client');
const moment = require('moment');

const prisma = new PrismaClient();

class IncompleteDataService {
  /**
   * Получение отчета по незаполненным данным
   */
  async getIncompleteDataReport(filters = {}, pagination = {}) {
    try {
      const {
        userId,
        entity,
        status,
        completionRateMin,
        completionRateMax,
        dateFrom,
        dateTo
      } = filters;

      const {
        page = 1,
        limit = 50
      } = pagination;

      const where = {};

      if (userId) where.userId = userId;
      if (entity) where.entity = entity;
      if (status) where.status = status;
      
      if (completionRateMin !== undefined || completionRateMax !== undefined) {
        where.completionRate = {};
        if (completionRateMin !== undefined) where.completionRate.gte = completionRateMin;
        if (completionRateMax !== undefined) where.completionRate.lte = completionRateMax;
      }
      
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo);
      }

      const [incompleteData, total] = await Promise.all([
        prisma.incompleteDataLog.findMany({
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
          orderBy: [
            { completionRate: 'asc' },
            { createdAt: 'desc' }
          ],
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.incompleteDataLog.count({ where })
      ]);

      return {
        incompleteData,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      console.error('Ошибка при получении отчета по незаполненным данным:', error);
      throw error;
    }
  }

  /**
   * Получение статистики по незаполненным данным
   */
  async getIncompleteDataStats() {
    try {
      const [
        totalIncomplete,
        byEntity,
        byUser,
        byStatus,
        avgCompletionRate,
        oldestIncomplete
      ] = await Promise.all([
        // Общее количество незаполненных записей
        prisma.incompleteDataLog.count({
          where: { status: { not: 'COMPLETED' } }
        }),
        
        // По сущностям
        prisma.incompleteDataLog.groupBy({
          by: ['entity'],
          where: { status: { not: 'COMPLETED' } },
          _count: { id: true },
          _avg: { completionRate: true },
          orderBy: { _count: { id: 'desc' } }
        }),
        
        // По пользователям
        prisma.incompleteDataLog.groupBy({
          by: ['userId'],
          where: { 
            status: { not: 'COMPLETED' },
            userId: { not: null }
          },
          _count: { id: true },
          _avg: { completionRate: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10
        }),
        
        // По статусам
        prisma.incompleteDataLog.groupBy({
          by: ['status'],
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } }
        }),
        
        // Средний процент заполнения
        prisma.incompleteDataLog.aggregate({
          where: { status: { not: 'COMPLETED' } },
          _avg: { completionRate: true }
        }),
        
        // Самые старые незаполненные записи
        prisma.incompleteDataLog.findMany({
          where: { status: { not: 'COMPLETED' } },
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'asc' },
          take: 5
        })
      ]);

      // Получаем информацию о пользователях
      const userIds = byUser.map(u => u.userId).filter(Boolean);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true }
      });

      const userMap = users.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {});

      const byUserWithNames = byUser.map(u => ({
        ...u,
        user: u.userId ? userMap[u.userId] : null
      }));

      return {
        totalIncomplete,
        byEntity,
        byUser: byUserWithNames,
        byStatus,
        avgCompletionRate: avgCompletionRate._avg.completionRate || 0,
        oldestIncomplete
      };

    } catch (error) {
      console.error('Ошибка при получении статистики по незаполненным данным:', error);
      throw error;
    }
  }

  /**
   * Отправка напоминаний о незаполненных данных
   */
  async sendReminders() {
    try {
      const pendingData = await prisma.incompleteDataLog.findMany({
        where: {
          status: 'PENDING',
          userId: { not: null },
          OR: [
            { lastReminderAt: null },
            { 
              lastReminderAt: {
                lt: moment().subtract(24, 'hours').toDate()
              }
            }
          ]
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, telegramId: true }
          }
        },
        take: 100 // Ограничиваем количество напоминаний за раз
      });

      const reminders = [];

      for (const item of pendingData) {
        try {
          // Создаем уведомление
          const notification = await prisma.notification.create({
            data: {
              userId: item.userId,
              type: 'SYSTEM_ALERT',
              title: 'Незаполненные данные',
              message: `У вас есть незаполненные поля в ${item.entity}. Процент заполнения: ${item.completionRate.toFixed(1)}%`,
              data: {
                entity: item.entity,
                entityId: item.entityId,
                missingFields: item.missingFields,
                completionRate: item.completionRate
              }
            }
          });

          // Обновляем счетчик напоминаний
          await prisma.incompleteDataLog.update({
            where: { id: item.id },
            data: {
              remindersSent: item.remindersSent + 1,
              lastReminderAt: new Date()
            }
          });

          reminders.push({
            userId: item.userId,
            entity: item.entity,
            entityId: item.entityId,
            notificationId: notification.id
          });

        } catch (error) {
          console.error(`Ошибка при отправке напоминания для ${item.id}:`, error);
        }
      }

      console.log(`Отправлено ${reminders.length} напоминаний о незаполненных данных`);
      return reminders;

    } catch (error) {
      console.error('Ошибка при отправке напоминаний:', error);
      throw error;
    }
  }

  /**
   * Обработка незаполненных данных (cron задача)
   */
  async processIncompleteData() {
    try {
      console.log('Запуск обработки незаполненных данных...');

      // Отправляем напоминания
      const reminders = await this.sendReminders();

      // Помечаем старые записи как просроченные
      const expiredThreshold = moment().subtract(30, 'days').toDate();
      const expiredResult = await prisma.incompleteDataLog.updateMany({
        where: {
          status: 'PENDING',
          createdAt: { lt: expiredThreshold }
        },
        data: {
          status: 'EXPIRED'
        }
      });

      // Проверяем завершенные записи
      const completedResult = await prisma.incompleteDataLog.updateMany({
        where: {
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          completionRate: 100
        },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });

      console.log(`Обработка завершена:
        - Отправлено напоминаний: ${reminders.length}
        - Помечено как просроченные: ${expiredResult.count}
        - Помечено как завершенные: ${completedResult.count}`);

      return {
        remindersSent: reminders.length,
        expired: expiredResult.count,
        completed: completedResult.count
      };

    } catch (error) {
      console.error('Ошибка при обработке незаполненных данных:', error);
      throw error;
    }
  }

  /**
   * Получение детальной информации о незаполненной записи
   */
  async getIncompleteDataDetails(id) {
    try {
      const incompleteData = await prisma.incompleteDataLog.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true
            }
          }
        }
      });

      if (!incompleteData) {
        throw new Error('Запись не найдена');
      }

      // Получаем историю изменений для этой сущности
      const auditHistory = await prisma.systemAuditLog.findMany({
        where: {
          entity: incompleteData.entity,
          entityId: incompleteData.entityId
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      return {
        ...incompleteData,
        auditHistory
      };

    } catch (error) {
      console.error('Ошибка при получении деталей незаполненной записи:', error);
      throw error;
    }
  }

  /**
   * Обновление статуса незаполненной записи
   */
  async updateIncompleteDataStatus(id, status, userId) {
    try {
      const updatedRecord = await prisma.incompleteDataLog.update({
        where: { id },
        data: {
          status,
          completedAt: status === 'COMPLETED' ? new Date() : null,
          updatedAt: new Date()
        }
      });

      // Логируем изменение статуса
      const auditService = require('./auditService');
      await auditService.logSystemAction({
        userId,
        action: 'UPDATE',
        entity: 'INCOMPLETE_DATA_LOG',
        entityId: id,
        description: `Изменен статус незаполненных данных на ${status}`,
        newValues: { status }
      });

      return updatedRecord;

    } catch (error) {
      console.error('Ошибка при обновлении статуса незаполненной записи:', error);
      throw error;
    }
  }

  /**
   * Получение рекомендаций по заполнению данных
   */
  async getCompletionRecommendations(entity, entityId) {
    try {
      const incompleteData = await prisma.incompleteDataLog.findUnique({
        where: {
          entity_entityId: {
            entity,
            entityId
          }
        }
      });

      if (!incompleteData) {
        return { recommendations: [] };
      }

      const recommendations = [];

      // Генерируем рекомендации на основе недостающих полей
      for (const field of incompleteData.missingFields) {
        const recommendation = this.getFieldRecommendation(entity, field);
        if (recommendation) {
          recommendations.push(recommendation);
        }
      }

      // Сортируем по приоритету
      recommendations.sort((a, b) => b.priority - a.priority);

      return {
        entity,
        entityId,
        completionRate: incompleteData.completionRate,
        missingFields: incompleteData.missingFields,
        recommendations
      };

    } catch (error) {
      console.error('Ошибка при получении рекомендаций:', error);
      throw error;
    }
  }

  /**
   * Получение рекомендации для конкретного поля
   */
  getFieldRecommendation(entity, field) {
    const recommendations = {
      'User': {
        'phoneNumber': {
          title: 'Добавьте номер телефона',
          description: 'Номер телефона необходим для связи и уведомлений',
          priority: 8,
          example: '+998901234567'
        },
        'email': {
          title: 'Укажите email адрес',
          description: 'Email используется для входа в систему и уведомлений',
          priority: 10,
          example: 'user@example.com'
        }
      },
      'Machine': {
        'locationId': {
          title: 'Укажите местоположение автомата',
          description: 'Местоположение необходимо для планирования маршрутов',
          priority: 9,
          example: 'Выберите из списка доступных локаций'
        },
        'serialNumber': {
          title: 'Добавьте серийный номер',
          description: 'Серийный номер нужен для идентификации и обслуживания',
          priority: 8,
          example: 'SN123456789'
        }
      },
      'Task': {
        'dueDate': {
          title: 'Установите срок выполнения',
          description: 'Срок выполнения помогает планировать работу',
          priority: 7,
          example: 'Выберите дату и время'
        },
        'assignedToId': {
          title: 'Назначьте исполнителя',
          description: 'Задача должна быть назначена конкретному сотруднику',
          priority: 9,
          example: 'Выберите из списка сотрудников'
        }
      }
    };

    return recommendations[entity]?.[field] || {
      title: `Заполните поле ${field}`,
      description: 'Это поле обязательно для заполнения',
      priority: 5,
      example: 'Введите корректное значение'
    };
  }
}

module.exports = new IncompleteDataService();
