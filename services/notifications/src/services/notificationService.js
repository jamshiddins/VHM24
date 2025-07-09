/**
 * VHM24 Notification Service
 * Централизованная система уведомлений с поддержкой различных каналов
 */

const { getPrismaClient } = require('@vhm24/database');
const TelegramBot = require('node-telegram-bot-api');
const nodemailer = require('nodemailer');
const winston = require('winston');

class NotificationService {
  constructor() {
    this.prisma = getPrismaClient();
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'notifications.log' })
      ]
    });

    // Инициализация Telegram бота для уведомлений
    if (process.env.TELEGRAM_BOT_TOKEN) {
      this.telegramBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
    }

    // Инициализация email транспорта
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Типы уведомлений
    this.notificationTypes = {
      TASK_OVERDUE: {
        priority: 'HIGH',
        channels: ['telegram', 'email'],
        template: 'task_overdue'
      },
      LOW_STOCK: {
        priority: 'MEDIUM',
        channels: ['telegram'],
        template: 'low_stock'
      },
      MACHINE_OFFLINE: {
        priority: 'HIGH',
        channels: ['telegram', 'email'],
        template: 'machine_offline'
      },
      ROUTE_COMPLETED: {
        priority: 'LOW',
        channels: ['telegram'],
        template: 'route_completed'
      },
      MAINTENANCE_DUE: {
        priority: 'MEDIUM',
        channels: ['telegram', 'email'],
        template: 'maintenance_due'
      },
      INCOMPLETE_DATA: {
        priority: 'MEDIUM',
        channels: ['telegram'],
        template: 'incomplete_data'
      },
      SYSTEM_ALERT: {
        priority: 'HIGH',
        channels: ['telegram', 'email'],
        template: 'system_alert'
      },
      FUEL_REPORT: {
        priority: 'LOW',
        channels: ['telegram'],
        template: 'fuel_report'
      },
      ARRIVAL_CONFIRMATION: {
        priority: 'LOW',
        channels: ['telegram'],
        template: 'arrival_confirmation'
      },
      WAREHOUSE_RECEIPT: {
        priority: 'MEDIUM',
        channels: ['telegram'],
        template: 'warehouse_receipt'
      }
    };

    // Шаблоны сообщений
    this.templates = {
      task_overdue: {
        telegram: '⚠️ *Просроченная задача*\n\n📋 {taskTitle}\n👤 Исполнитель: {assignee}\n⏰ Просрочена на: {overdueDays} дн.\n\n🔗 Перейти к задаче: /task_{taskId}',
        email: {
          subject: 'Просроченная задача: {taskTitle}',
          html: '<h2>Просроченная задача</h2><p><strong>Задача:</strong> {taskTitle}</p><p><strong>Исполнитель:</strong> {assignee}</p><p><strong>Просрочена на:</strong> {overdueDays} дней</p>'
        }
      },
      low_stock: {
        telegram: '📦 *Низкий остаток товара*\n\n🏷️ {itemName}\n📊 Остаток: {quantity} {unit}\n⚠️ Минимум: {minQuantity} {unit}\n📍 Склад: {warehouse}',
        email: {
          subject: 'Низкий остаток: {itemName}',
          html: '<h2>Низкий остаток товара</h2><p><strong>Товар:</strong> {itemName}</p><p><strong>Остаток:</strong> {quantity} {unit}</p>'
        }
      },
      machine_offline: {
        telegram: '🚨 *Автомат не в сети*\n\n🤖 {machineName}\n📍 {location}\n⏰ Не в сети: {offlineTime}\n\n🔧 Требуется проверка',
        email: {
          subject: 'Автомат не в сети: {machineName}',
          html: '<h2>Автомат не в сети</h2><p><strong>Автомат:</strong> {machineName}</p><p><strong>Адрес:</strong> {location}</p>'
        }
      },
      route_completed: {
        telegram: '✅ *Маршрут завершен*\n\n🚛 {routeName}\n👤 Водитель: {driverName}\n⏰ Время: {completionTime}\n📊 Остановок: {stopsCount}',
        email: {
          subject: 'Маршрут завершен: {routeName}',
          html: '<h2>Маршрут завершен</h2><p><strong>Маршрут:</strong> {routeName}</p><p><strong>Водитель:</strong> {driverName}</p>'
        }
      },
      maintenance_due: {
        telegram: '🔧 *Требуется техобслуживание*\n\n🤖 {machineName}\n📍 {location}\n📅 Плановая дата: {dueDate}\n⚠️ Просрочка: {overdueDays} дн.',
        email: {
          subject: 'Требуется ТО: {machineName}',
          html: '<h2>Требуется техническое обслуживание</h2><p><strong>Автомат:</strong> {machineName}</p><p><strong>Плановая дата:</strong> {dueDate}</p>'
        }
      },
      incomplete_data: {
        telegram: '📝 *Незаполненные данные*\n\n👤 Пользователь: {userName}\n📋 Поля: {missingFields}\n⏰ Время: {timestamp}',
        email: {
          subject: 'Незаполненные данные от {userName}',
          html: '<h2>Незаполненные данные</h2><p><strong>Пользователь:</strong> {userName}</p><p><strong>Поля:</strong> {missingFields}</p>'
        }
      },
      system_alert: {
        telegram: '🚨 *Системное уведомление*\n\n⚠️ {alertType}\n📝 {message}\n⏰ {timestamp}',
        email: {
          subject: 'Системное уведомление: {alertType}',
          html: '<h2>Системное уведомление</h2><p><strong>Тип:</strong> {alertType}</p><p><strong>Сообщение:</strong> {message}</p>'
        }
      },
      fuel_report: {
        telegram: '⛽ *Отчет о заправке*\n\n🚛 Водитель: {driverName}\n💰 Сумма: {amount} сум\n📍 Локация: {location}\n⏰ {timestamp}',
        email: {
          subject: 'Отчет о заправке от {driverName}',
          html: '<h2>Отчет о заправке</h2><p><strong>Водитель:</strong> {driverName}</p><p><strong>Сумма:</strong> {amount} сум</p>'
        }
      },
      arrival_confirmation: {
        telegram: '📍 *Подтверждение прибытия*\n\n👤 {driverName}\n🎯 {stopName}\n📍 {location}\n⏰ {arrivalTime}',
        email: {
          subject: 'Прибытие: {driverName} - {stopName}',
          html: '<h2>Подтверждение прибытия</h2><p><strong>Водитель:</strong> {driverName}</p><p><strong>Остановка:</strong> {stopName}</p>'
        }
      },
      warehouse_receipt: {
        telegram: '📦 *Поступление на склад*\n\n🏷️ {itemName}\n📊 Количество: {quantity} {unit}\n👤 Принял: {receiverName}\n⏰ {timestamp}',
        email: {
          subject: 'Поступление: {itemName}',
          html: '<h2>Поступление на склад</h2><p><strong>Товар:</strong> {itemName}</p><p><strong>Количество:</strong> {quantity} {unit}</p>'
        }
      }
    };
  }

  /**
   * Отправка уведомления
   */
  async sendNotification(type, recipients, data, options = {}) {
    try {
      const notificationConfig = this.notificationTypes[type];
      if (!notificationConfig) {
        throw new Error(`Unknown notification type: ${type}`);
      }

      // Создаем запись в базе данных (если таблица существует)
      let notification = null;
      try {
        notification = await this.prisma.notification.create({
          data: {
            type,
            title: this.generateTitle(type, data),
            message: this.generateMessage(type, data, 'telegram'),
            recipients: Array.isArray(recipients) ? recipients : [recipients],
            priority: notificationConfig.priority,
            channels: notificationConfig.channels,
            data: data,
            status: 'PENDING'
          }
        });
      } catch (dbError) {
        this.logger.warn('Database notification table not available, continuing without DB logging');
      }

      // Отправляем по всем каналам
      const results = [];
      for (const channel of notificationConfig.channels) {
        if (options.channels && !options.channels.includes(channel)) {
          continue;
        }

        try {
          const result = await this.sendByChannel(channel, type, recipients, data);
          results.push({ channel, success: true, result });
        } catch (error) {
          this.logger.error(`Failed to send ${type} via ${channel}:`, error);
          results.push({ channel, success: false, error: error.message });
        }
      }

      // Обновляем статус уведомления (если запись была создана)
      const allSuccess = results.every(r => r.success);
      if (notification) {
        try {
          await this.prisma.notification.update({
            where: { id: notification.id },
            data: {
              status: allSuccess ? 'SENT' : 'FAILED',
              sentAt: allSuccess ? new Date() : null,
              deliveryResults: results
            }
          });
        } catch (updateError) {
          this.logger.warn('Failed to update notification status in database');
        }
      }

      return {
        notificationId: notification?.id || 'no-db',
        success: allSuccess,
        results
      };

    } catch (error) {
      this.logger.error('Send notification error:', error);
      throw error;
    }
  }

  /**
   * Отправка по конкретному каналу
   */
  async sendByChannel(channel, type, recipients, data) {
    switch (channel) {
      case 'telegram':
        return await this.sendTelegram(type, recipients, data);
      case 'email':
        return await this.sendEmail(type, recipients, data);
      case 'sms':
        return await this.sendSMS(type, recipients, data);
      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }
  }

  /**
   * Отправка Telegram уведомления
   */
  async sendTelegram(type, recipients, data) {
    if (!this.telegramBot) {
      throw new Error('Telegram bot not configured');
    }

    const message = this.generateMessage(type, data, 'telegram');
    const results = [];

    for (const recipient of Array.isArray(recipients) ? recipients : [recipients]) {
      try {
        // Получаем Telegram ID пользователя
        const user = await this.prisma.user.findFirst({
          where: {
            OR: [
              { id: recipient },
              { email: recipient },
              { telegramId: recipient }
            ]
          }
        });

        if (!user?.telegramId) {
          throw new Error(`No Telegram ID for recipient: ${recipient}`);
        }

        await this.telegramBot.sendMessage(user.telegramId, message, {
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        });

        results.push({ recipient, success: true });
      } catch (error) {
        results.push({ recipient, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Отправка Email уведомления
   */
  async sendEmail(type, recipients, data) {
    if (!this.emailTransporter) {
      throw new Error('Email transporter not configured');
    }

    const template = this.templates[this.notificationTypes[type].template]?.email;
    if (!template) {
      throw new Error(`No email template for type: ${type}`);
    }

    const subject = this.interpolateTemplate(template.subject, data);
    const html = this.interpolateTemplate(template.html, data);

    const results = [];

    for (const recipient of Array.isArray(recipients) ? recipients : [recipients]) {
      try {
        // Получаем email пользователя
        let email = recipient;
        if (!recipient.includes('@')) {
          const user = await this.prisma.user.findFirst({
            where: { id: recipient }
          });
          email = user?.email;
        }

        if (!email) {
          throw new Error(`No email for recipient: ${recipient}`);
        }

        await this.emailTransporter.sendMail({
          from: process.env.SMTP_FROM || 'noreply@vhm24.com',
          to: email,
          subject,
          html
        });

        results.push({ recipient, success: true });
      } catch (error) {
        results.push({ recipient, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Отправка SMS уведомления (заглушка)
   */
  async sendSMS(type, recipients, data) {
    // TODO: Интеграция с SMS провайдером
    this.logger.info('SMS sending not implemented yet');
    return [];
  }

  /**
   * Генерация заголовка уведомления
   */
  generateTitle(type, data) {
    const titles = {
      TASK_OVERDUE: `Просроченная задача: ${data.taskTitle}`,
      LOW_STOCK: `Низкий остаток: ${data.itemName}`,
      MACHINE_OFFLINE: `Автомат не в сети: ${data.machineName}`,
      ROUTE_COMPLETED: `Маршрут завершен: ${data.routeName}`,
      MAINTENANCE_DUE: `Требуется ТО: ${data.machineName}`,
      INCOMPLETE_DATA: `Незаполненные данные: ${data.userName}`,
      SYSTEM_ALERT: `Системное уведомление: ${data.alertType}`,
      FUEL_REPORT: `Заправка: ${data.driverName}`,
      ARRIVAL_CONFIRMATION: `Прибытие: ${data.driverName}`,
      WAREHOUSE_RECEIPT: `Поступление: ${data.itemName}`
    };

    return titles[type] || `Уведомление: ${type}`;
  }

  /**
   * Генерация сообщения по шаблону
   */
  generateMessage(type, data, channel) {
    const notificationConfig = this.notificationTypes[type];
    const template = this.templates[notificationConfig.template]?.[channel];
    
    if (!template) {
      return `Уведомление типа ${type}: ${JSON.stringify(data)}`;
    }

    return this.interpolateTemplate(template, data);
  }

  /**
   * Интерполяция шаблона
   */
  interpolateTemplate(template, data) {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : match;
    });
  }

  /**
   * Массовая отправка уведомлений по расписанию
   */
  async sendScheduledNotifications() {
    try {
      // Проверяем просроченные задачи
      await this.checkOverdueTasks();
      
      // Проверяем низкие остатки
      await this.checkLowStock();
      
      // Проверяем офлайн автоматы
      await this.checkOfflineMachines();
      
      // Проверяем просроченное ТО
      await this.checkOverdueMaintenance();

      this.logger.info('Scheduled notifications check completed');
    } catch (error) {
      this.logger.error('Scheduled notifications error:', error);
    }
  }

  /**
   * Проверка просроченных задач
   */
  async checkOverdueTasks() {
    const overdueTasks = await this.prisma.task.findMany({
      where: {
        status: { in: ['CREATED', 'ASSIGNED', 'IN_PROGRESS'] },
        dueDate: { lt: new Date() }
      },
      include: {
        assignee: true
      }
    });

    for (const task of overdueTasks) {
      const overdueDays = Math.floor((new Date() - task.dueDate) / (1000 * 60 * 60 * 24));
      
      await this.sendNotification('TASK_OVERDUE', [task.assigneeId], {
        taskId: task.id,
        taskTitle: task.title,
        assignee: task.assignee.name,
        overdueDays
      });
    }
  }

  /**
   * Проверка низких остатков
   */
  async checkLowStock() {
    try {
      // Получаем товары с низкими остатками
      const lowStockItems = await this.prisma.inventoryItem.findMany({
        where: {
          AND: [
            { quantity: { not: null } },
            { minQuantity: { not: null } }
          ]
        }
      });

      // Фильтруем товары с низкими остатками
      const filteredItems = lowStockItems.filter(item => 
        item.quantity <= (item.minQuantity || 0)
      );

      for (const item of filteredItems) {
        // Отправляем менеджерам склада
        const warehouseManagers = await this.prisma.user.findMany({
          where: {
            roles: { has: 'WAREHOUSE_MANAGER' },
            isActive: true
          }
        });

        for (const manager of warehouseManagers) {
          await this.sendNotification('LOW_STOCK', [manager.id], {
            itemName: item.name,
            quantity: item.quantity,
            unit: item.unit || 'шт',
            minQuantity: item.minQuantity || 0,
            warehouse: 'Основной склад'
          });
        }
      }
    } catch (error) {
      this.logger.error('Check low stock error:', error);
    }
  }

  /**
   * Проверка офлайн автоматов
   */
  async checkOfflineMachines() {
    const offlineThreshold = new Date(Date.now() - 30 * 60 * 1000); // 30 минут
    
    const offlineMachines = await this.prisma.machine.findMany({
      where: {
        lastPing: { lt: offlineThreshold },
        status: { not: 'MAINTENANCE' }
      }
    });

    for (const machine of offlineMachines) {
      const offlineTime = Math.floor((new Date() - machine.lastPing) / (1000 * 60));
      
      // Отправляем техникам
      const technicians = await this.prisma.user.findMany({
        where: {
          role: 'TECHNICIAN',
          isActive: true
        }
      });

      for (const technician of technicians) {
        await this.sendNotification('MACHINE_OFFLINE', [technician.id], {
          machineName: machine.name,
          location: machine.location?.address || 'Адрес не указан',
          offlineTime: `${offlineTime} мин`
        });
      }
    }
  }

  /**
   * Проверка просроченного ТО
   */
  async checkOverdueMaintenance() {
    const overdueMaintenance = await this.prisma.maintenanceSchedule.findMany({
      where: {
        nextMaintenanceDate: { lt: new Date() },
        status: 'SCHEDULED'
      },
      include: {
        machine: true
      }
    });

    for (const maintenance of overdueMaintenance) {
      const overdueDays = Math.floor((new Date() - maintenance.nextMaintenanceDate) / (1000 * 60 * 60 * 24));
      
      // Отправляем техникам
      const technicians = await this.prisma.user.findMany({
        where: {
          role: 'TECHNICIAN',
          isActive: true
        }
      });

      for (const technician of technicians) {
        await this.sendNotification('MAINTENANCE_DUE', [technician.id], {
          machineName: maintenance.machine.name,
          location: maintenance.machine.location?.address || 'Адрес не указан',
          dueDate: maintenance.nextMaintenanceDate.toLocaleDateString('ru-RU'),
          overdueDays
        });
      }
    }
  }

  /**
   * Получение истории уведомлений
   */
  async getNotificationHistory(filters = {}) {
    const where = {};
    
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.dateFrom) where.createdAt = { gte: new Date(filters.dateFrom) };
    if (filters.dateTo) where.createdAt = { ...where.createdAt, lte: new Date(filters.dateTo) };

    return await this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 100,
      skip: filters.offset || 0
    });
  }

  /**
   * Статистика уведомлений
   */
  async getNotificationStats(period = '7d') {
    const dateFrom = new Date();
    if (period === '7d') dateFrom.setDate(dateFrom.getDate() - 7);
    else if (period === '30d') dateFrom.setDate(dateFrom.getDate() - 30);
    else if (period === '1y') dateFrom.setFullYear(dateFrom.getFullYear() - 1);

    const stats = await this.prisma.notification.groupBy({
      by: ['type', 'status'],
      where: {
        createdAt: { gte: dateFrom }
      },
      _count: true
    });

    return stats;
  }
}

module.exports = NotificationService;
