const logger = require('../utils/logger');
const apiService = require('./api');

/**
 * Сервис для работы с пользователями
 */
class UsersService {
  /**
   * Получает информацию о пользователе по его Telegram ID
   * @param {string} telegramId - Telegram ID пользователя
   * @returns {Promise<Object|null>} - Информация о пользователе или null
   */
  static async getUserByTelegramId(telegramId) {
    try {
      // В режиме разработки возвращаем мок-данные
      const mockUsers = [
        { id: '1', telegramId: '123456789', username: 'user1', role: 'ADMIN', firstName: 'Иван', lastName: 'Иванов', createdAt: new Date('2025-01-01') },
        { id: '2', telegramId: '987654321', username: 'user2', role: 'OPERATOR', firstName: 'Петр', lastName: 'Петров', createdAt: new Date('2025-02-01') },
        { id: '3', telegramId: '555555555', username: 'user3', role: 'TECHNICIAN', firstName: 'Алексей', lastName: 'Алексеев', createdAt: new Date('2025-03-01') }
      ];
      
      // Находим пользователя по Telegram ID
      const user = mockUsers.find(u => u.telegramId === telegramId);
      
      if (!user) {
        logger.warn(`User with Telegram ID ${telegramId} not found`);
        return null;
      }
      
      return user;
    } catch (error) {
      logger.error('Error getting user by Telegram ID:', error);
      return null;
    }
  }
  
  /**
   * Создает нового пользователя
   * @param {Object} userData - Данные пользователя
   * @returns {Promise<Object|null>} - Созданный пользователь или null
   */
  static async createUser(userData) {
    try {
      // Проверяем обязательные поля
      if (!userData.telegramId) {
        logger.error('Missing required field: telegramId');
        return null;
      }
      
      // В режиме разработки просто логируем
      logger.info(`Creating new user with Telegram ID: ${userData.telegramId}`);
      
      // Создаем пользователя с дефолтными значениями
      const newUser = {
        id: Math.random().toString(36).substring(2, 10),
        telegramId: userData.telegramId,
        username: userData.username || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        role: userData.role || 'USER',
        createdAt: new Date()
      };
      
      // В реальном приложении здесь будет сохранение в базу данных
      // await apiService.createUser(newUser);
      
      return newUser;
    } catch (error) {
      logger.error('Error creating user:', error);
      return null;
    }
  }
  
  /**
   * Обновляет информацию о пользователе
   * @param {string} userId - ID пользователя
   * @param {Object} userData - Новые данные пользователя
   * @returns {Promise<Object|null>} - Обновленный пользователь или null
   */
  static async updateUser(userId, userData) {
    try {
      // В режиме разработки просто логируем
      logger.info(`Updating user with ID: ${userId}`);
      logger.debug('Update data:', userData);
      
      // В реальном приложении здесь будет обновление в базе данных
      // await apiService.updateUser(userId, userData);
      
      // Возвращаем обновленного пользователя
      return {
        id: userId,
        ...userData,
        updatedAt: new Date()
      };
    } catch (error) {
      logger.error('Error updating user:', error);
      return null;
    }
  }
  
  /**
   * Проверяет, имеет ли пользователь указанную роль
   * @param {Object} user - Пользователь
   * @param {string|Array} roles - Роль или массив ролей
   * @returns {boolean} - Результат проверки
   */
  static hasRole(user, roles) {
    if (!user || !user.role) return false;
    
    // Если передана одна роль в виде строки
    if (typeof roles === 'string') {
      return user.role === roles;
    }
    
    // Если передан массив ролей
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    
    return false;
  }
}

module.exports = UsersService;
