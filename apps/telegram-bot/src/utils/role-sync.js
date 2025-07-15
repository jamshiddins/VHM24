/**
 * Утилиты для синхронизации ролей пользователей между Telegram ботом и API
 */
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Проверка роли пользователя по Telegram ID
 * @param {string} telegramId - Telegram ID пользователя
 * @returns {Promise<Object|null>} - Объект пользователя или null, если пользователь не найден
 */
async function checkUserRole(telegramId) {
  try {
    // Проверяем наличие пользователя в базе данных
    const user = await prisma.user.findFirst({
      where: {
        telegramId: telegramId
      }
    });
    
    if (!user) {
      console.log(`Пользователь с Telegram ID ${telegramId} не найден в базе данных`);
      return null;
    }
    
    // Проверяем, не заблокирован ли пользователь
    if (user.status === 'BLOCKED') {
      console.log(`Пользователь с Telegram ID ${telegramId} заблокирован`);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Ошибка при проверке роли пользователя:', error);
    return null;
  }
}

/**
 * Получение текста роли
 * @param {string} role - Роль пользователя
 * @returns {string} - Текст роли
 */
function getRoleText(role) {
  const roles = {
    ADMIN: 'Администратор',
    MANAGER: 'Менеджер',
    WAREHOUSE: 'Складской работник',
    OPERATOR: 'Оператор',
    TECHNICIAN: 'Техник',
    DRIVER: 'Водитель'
  };
  
  return roles[role] || 'Пользователь';
}

/**
 * Синхронизация пользователя с API
 * @param {Object} user - Объект пользователя
 * @returns {Promise<boolean>} - true, если синхронизация прошла успешно, false в противном случае
 */
async function syncUserWithAPI(user) {
  try {
    // Получаем URL API из переменных окружения
    const API_BASE_URL = process.env.API_BASE_URL || `${process.env.RAILWAY_PUBLIC_URL || 'http://localhost:3000'}/api`;
    
    // Отправляем запрос к API для синхронизации пользователя
    const response = await axios.post(`${API_BASE_URL}/users/sync`, {
      telegramId: user.telegramId,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      role: user.role
    }, {
      timeout: 5000
    });
    
    if (response.status === 200) {
      console.log(`Пользователь с Telegram ID ${user.telegramId} успешно синхронизирован с API`);
      return true;
    } else {
      console.error(`Ошибка синхронизации пользователя с API: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.error('Ошибка при синхронизации пользователя с API:', error.message);
    return false;
  }
}

/**
 * Создание нового пользователя
 * @param {Object} userData - Данные пользователя
 * @returns {Promise<Object|null>} - Объект созданного пользователя или null, если произошла ошибка
 */
async function createUser(userData) {
  try {
    // Создаем пользователя в базе данных
    const user = await prisma.user.create({
      data: {
        telegramId: userData.telegramId,
        firstName: userData.firstName,
        lastName: userData.lastName,
        username: userData.username,
        role: userData.role || 'OPERATOR',
        status: 'ACTIVE'
      }
    });
    
    // Синхронизируем пользователя с API
    await syncUserWithAPI(user);
    
    return user;
  } catch (error) {
    console.error('Ошибка при создании пользователя:', error);
    return null;
  }
}

/**
 * Обновление данных пользователя
 * @param {string} telegramId - Telegram ID пользователя
 * @param {Object} userData - Данные пользователя для обновления
 * @returns {Promise<Object|null>} - Объект обновленного пользователя или null, если произошла ошибка
 */
async function updateUser(telegramId, userData) {
  try {
    // Обновляем пользователя в базе данных
    const user = await prisma.user.update({
      where: {
        telegramId: telegramId
      },
      data: userData
    });
    
    // Синхронизируем пользователя с API
    await syncUserWithAPI(user);
    
    return user;
  } catch (error) {
    console.error('Ошибка при обновлении пользователя:', error);
    return null;
  }
}

/**
 * Получение списка всех пользователей
 * @returns {Promise<Array|null>} - Массив пользователей или null, если произошла ошибка
 */
async function getAllUsers() {
  try {
    // Получаем всех пользователей из базы данных
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return users;
  } catch (error) {
    console.error('Ошибка при получении списка пользователей:', error);
    return null;
  }
}

/**
 * Получение списка пользователей по роли
 * @param {string} role - Роль пользователей
 * @returns {Promise<Array|null>} - Массив пользователей или null, если произошла ошибка
 */
async function getUsersByRole(role) {
  try {
    // Получаем пользователей с указанной ролью из базы данных
    const users = await prisma.user.findMany({
      where: {
        role: role
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return users;
  } catch (error) {
    console.error('Ошибка при получении списка пользователей по роли:', error);
    return null;
  }
}

/**
 * Блокировка пользователя
 * @param {string} telegramId - Telegram ID пользователя
 * @returns {Promise<boolean>} - true, если блокировка прошла успешно, false в противном случае
 */
async function blockUser(telegramId) {
  try {
    // Блокируем пользователя в базе данных
    await prisma.user.update({
      where: {
        telegramId: telegramId
      },
      data: {
        status: 'BLOCKED'
      }
    });
    
    return true;
  } catch (error) {
    console.error('Ошибка при блокировке пользователя:', error);
    return false;
  }
}

/**
 * Разблокировка пользователя
 * @param {string} telegramId - Telegram ID пользователя
 * @returns {Promise<boolean>} - true, если разблокировка прошла успешно, false в противном случае
 */
async function unblockUser(telegramId) {
  try {
    // Разблокируем пользователя в базе данных
    await prisma.user.update({
      where: {
        telegramId: telegramId
      },
      data: {
        status: 'ACTIVE'
      }
    });
    
    return true;
  } catch (error) {
    console.error('Ошибка при разблокировке пользователя:', error);
    return false;
  }
}

module.exports = {
  checkUserRole,
  getRoleText,
  syncUserWithAPI,
  createUser,
  updateUser,
  getAllUsers,
  getUsersByRole,
  blockUser,
  unblockUser
};
