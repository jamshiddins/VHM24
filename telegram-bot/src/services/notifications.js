const logger = require('../utils/logger');
const apiService = require('./api');

/**
 * Сервис для работы с уведомлениями
 */
class NotificationsService {
  /**
   * Отправляет уведомление пользователю
   * @param {Object} bot - Экземпляр бота Telegraf
   * @param {string} userId - ID пользователя
   * @param {string} message - Текст сообщения
   * @param {Object} options - Дополнительные опции
   * @returns {Promise<boolean>} - Результат отправки
   */
  static async sendNotification(bot, userId, message, options = {}) {
    try {
      // Проверяем, что бот и ID пользователя переданы
      if (!bot || !userId) {
        logger.error('Missing required parameters for sending notification');
        return false;
      }
      
      // Отправляем сообщение
      await bot.telegram.sendMessage(userId, message, options);
      
      // Логируем успешную отправку
      logger.info(`Notification sent to user ${userId}`);
      
      // Сохраняем уведомление в базе данных, если нужно
      if (options.saveToDb) {
        await this.saveNotificationToDb(userId, message, options.type || 'INFO');
      }
      
      return true;
    } catch (error) {
      logger.error('Error sending notification:', error);
      return false;
    }
  }
  
  /**
   * Отправляет уведомление всем пользователям с определенной ролью
   * @param {Object} bot - Экземпляр бота Telegraf
   * @param {string} role - Роль пользователей
   * @param {string} message - Текст сообщения
   * @param {Object} options - Дополнительные опции
   * @returns {Promise<Object>} - Результат отправки
   */
  static async sendNotificationByRole(bot, role, message, options = {}) {
    try {
      // Получаем список пользователей с указанной ролью
      const users = await apiService.getUsersByRole(role);
      
      if (!users || users.length === 0) {
        logger.warn(`No users found with role ${role}`);
        return { success: false, sent: 0, total: 0 };
      }
      
      // Счетчики для статистики
      let sent = 0;
      const total = users.length;
      
      // Отправляем уведомления всем пользователям
      for (const user of users) {
        const result = await this.sendNotification(bot, user.telegramId, message, options);
        if (result) sent++;
      }
      
      // Логируем результат
      logger.info(`Sent notifications to ${sent}/${total} users with role ${role}`);
      
      return { success: true, sent, total };
    } catch (error) {
      logger.error('Error sending notifications by role:', error);
      return { success: false, sent: 0, total: 0, error: error.message };
    }
  }
  
  /**
   * Сохраняет уведомление в базе данных
   * @param {string} userId - ID пользователя
   * @param {string} message - Текст сообщения
   * @param {string} type - Тип уведомления
   * @returns {Promise<boolean>} - Результат сохранения
   */
  static async saveNotificationToDb(userId, message, type = 'INFO') {
    try {
      // В режиме разработки просто логируем
      logger.debug(`[DB] Saving notification for user ${userId}: ${message} (${type})`);
      
      // В реальном приложении здесь будет сохранение в базу данных
      // await apiService.createNotification({ userId, message, type, createdAt: new Date() });
      
      return true;
    } catch (error) {
      logger.error('Error saving notification to database:', error);
      return false;
    }
  }
  
  /**
   * Получает список уведомлений пользователя
   * @param {string} userId - ID пользователя
   * @param {Object} options - Опции фильтрации
   * @returns {Promise<Array>} - Список уведомлений
   */
  static async getUserNotifications(userId, options = {}) {
    try {
      // В режиме разработки возвращаем мок-данные
      const mockNotifications = [
        { id: '1', userId, message: 'Новая задача назначена', type: 'TASK', createdAt: new Date(Date.now() - 3600000) },
        { id: '2', userId, message: 'Обновление системы', type: 'SYSTEM', createdAt: new Date(Date.now() - 86400000) },
        { id: '3', userId, message: 'Напоминание о задаче', type: 'REMINDER', createdAt: new Date(Date.now() - 7200000) }
      ];
      
      // Фильтруем по типу, если указан
      let notifications = mockNotifications;
      if (options.type) {
        notifications = notifications.filter(n => n.type === options.type);
      }
      
      // Сортируем по дате (сначала новые)
      notifications.sort((a, b) => b.createdAt - a.createdAt);
      
      // Ограничиваем количество, если указано
      if (options.limit) {
        notifications = notifications.slice(0, options.limit);
      }
      
      return notifications;
    } catch (error) {
      logger.error('Error getting user notifications:', error);
      return [];
    }
  }
}

module.exports = NotificationsService;
