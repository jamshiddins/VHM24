const axios = require('axios');
const config = require('../config/bot');
const logger = require('../utils/logger');

// Создаем экземпляр axios с базовым URL
const api = axios.create({
  baseURL: config.baseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Добавляем перехватчик для обработки ошибок
api.interceptors.response.use(
  response => response,
  error => {
    // Логируем ошибку
    logger.error('API Error:', error);
    
    // Возвращаем отклоненный промис
    return Promise.reject(error);
  }
);

// Обработчик ошибок
const handleError = (error) => {
  if (error.response) {
    // Ошибка от сервера
    logger.error(`API Error: ${error.response.status} - ${error.response.data.message || JSON.stringify(error.response.data)}`);
    return { error: error.response.data, status: error.response.status };
  } else if (error.request) {
    // Ошибка сети
    logger.error(`Network Error: ${error.message}`);
    return { error: { message: 'Ошибка сети. Сервер недоступен.' }, status: 0 };
  } else {
    // Другие ошибки
    logger.error(`Request Error: ${error.message}`);
    return { error: { message: error.message }, status: 0 };
  }
};

// Методы API
const apiService = {
  // Получение пользователя по Telegram ID
  async getUserByTelegramId(telegramId) {
    try {
      // В режиме разработки возвращаем мок-данные
      if (process.env.SKIP_DATABASE === 'true') {
        logger.info(`[MOCK] Getting user by Telegram ID: ${telegramId}`);
        return {
          id: '1',
          telegramId: telegramId,
          firstName: 'Тестовый',
          lastName: 'Пользователь',
          role: 'ADMIN',
          status: 'ACTIVE'
        };
      }
      
      const response = await api.get(`/users/telegram/${telegramId}`);
      return response.data;
    } catch (error) {
      const errorData = handleError(error);
      if (errorData.status === 404) {
        return null; // Пользователь не найден
      }
      return null;
    }
  },
  
  // Получение пользователей по роли
  async getUsersByRole(role) {
    try {
      // В режиме разработки возвращаем мок-данные
      if (process.env.SKIP_DATABASE === 'true') {
        logger.info(`[MOCK] Getting users by role: ${role}`);
        
        // Мок-данные для разных ролей
        const mockUsers = {
          ADMIN: [
            { id: '1', telegramId: '123456789', firstName: 'Админ', lastName: 'Админов', role: 'ADMIN', status: 'ACTIVE' }
          ],
          MANAGER: [
            { id: '2', telegramId: '234567890', firstName: 'Менеджер', lastName: 'Менеджеров', role: 'MANAGER', status: 'ACTIVE' },
            { id: '3', telegramId: '345678901', firstName: 'Иван', lastName: 'Иванов', role: 'MANAGER', status: 'ACTIVE' }
          ],
          OPERATOR: [
            { id: '4', telegramId: '456789012', firstName: 'Оператор', lastName: 'Операторов', role: 'OPERATOR', status: 'ACTIVE' },
            { id: '5', telegramId: '567890123', firstName: 'Петр', lastName: 'Петров', role: 'OPERATOR', status: 'ACTIVE' }
          ],
          WAREHOUSE: [
            { id: '6', telegramId: '678901234', firstName: 'Склад', lastName: 'Складов', role: 'WAREHOUSE', status: 'ACTIVE' }
          ],
          TECHNICIAN: [
            { id: '7', telegramId: '789012345', firstName: 'Техник', lastName: 'Техников', role: 'TECHNICIAN', status: 'ACTIVE' },
            { id: '8', telegramId: '890123456', firstName: 'Алексей', lastName: 'Алексеев', role: 'TECHNICIAN', status: 'ACTIVE' }
          ]
        };
        
        // Возвращаем пользователей с указанной ролью или пустой массив
        return mockUsers[role] || [];
      }
      
      const response = await api.get(`/users/role/${role}`);
      return response.data;
    } catch (error) {
      handleError(error);
      return [];
    }
  },
  
  // Проверка доступа к автомату
  async checkMachineAccess(userId, machineId) {
    try {
      // В режиме разработки всегда разрешаем доступ
      if (process.env.SKIP_DATABASE === 'true') {
        logger.info(`[MOCK] Checking machine access for user ${userId} to machine ${machineId}`);
        return true;
      }
      
      const response = await api.get(`/users/${userId}/machines/${machineId}/access`);
      return response.data.hasAccess;
    } catch (error) {
      handleError(error);
      return false;
    }
  },
  
  // Получение списка задач пользователя
  async getUserTasks(userId, status = 'ASSIGNED') {
    try {
      // В режиме разработки возвращаем мок-данные
      if (process.env.SKIP_DATABASE === 'true') {
        logger.info(`[MOCK] Getting tasks for user ${userId} with status ${status}`);
        return [
          {
            id: '1',
            type: 'REPLACE_INGREDIENTS',
            machineId: '101',
            machineName: 'Кофейный автомат #101',
            status: 'ASSIGNED',
            deadline: new Date(Date.now() + 86400000).toISOString(),
            description: 'Заменить ингредиенты в автомате'
          },
          {
            id: '2',
            type: 'CLEANING',
            machineId: '102',
            machineName: 'Кофейный автомат #102',
            status: 'IN_PROGRESS',
            deadline: new Date(Date.now() + 172800000).toISOString(),
            description: 'Провести чистку автомата'
          }
        ];
      }
      
      const response = await api.get(`/users/${userId}/tasks?status=${status}`);
      return response.data;
    } catch (error) {
      handleError(error);
      return [];
    }
  },
  
  // Обновление статуса задачи
  async updateTaskStatus(taskId, status, data = {}) {
    try {
      // В режиме разработки имитируем успешное обновление
      if (process.env.SKIP_DATABASE === 'true') {
        logger.info(`[MOCK] Updating task ${taskId} status to ${status}`);
        return { success: true, message: 'Статус задачи обновлен' };
      }
      
      const response = await api.patch(`/tasks/${taskId}/status`, {
        status,
        ...data
      });
      return response.data;
    } catch (error) {
      handleError(error);
      return { success: false, message: 'Ошибка обновления статуса задачи' };
    }
  },
  
  // Создание уведомления
  async createNotification(notificationData) {
    try {
      // В режиме разработки имитируем успешное создание
      if (process.env.SKIP_DATABASE === 'true') {
        logger.info(`[MOCK] Creating notification for user ${notificationData.userId}`);
        return { 
          id: Math.random().toString(36).substring(2, 10),
          ...notificationData,
          createdAt: new Date()
        };
      }
      
      const response = await api.post('/notifications', notificationData);
      return response.data;
    } catch (error) {
      handleError(error);
      return { success: false, message: 'Ошибка создания уведомления' };
    }
  },
  
  // Получение уведомлений пользователя
  async getUserNotifications(userId, options = {}) {
    try {
      // В режиме разработки возвращаем мок-данные
      if (process.env.SKIP_DATABASE === 'true') {
        logger.info(`[MOCK] Getting notifications for user ${userId}`);
        
        // Создаем мок-данные для уведомлений
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
      }
      
      // Формируем параметры запроса
      const params = {};
      if (options.type) params.type = options.type;
      if (options.limit) params.limit = options.limit;
      
      const response = await api.get(`/users/${userId}/notifications`, { params });
      return response.data;
    } catch (error) {
      handleError(error);
      return [];
    }
  }
};

module.exports = apiService;
