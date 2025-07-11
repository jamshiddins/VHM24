const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Получить всех пользователей
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        phoneNumber: true,
        telegramId: true,
        telegramUsername: true,
        isActive: true,
        isDriver: true,
        registrationStatus: true,
        lastLogin: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить статистику пользователей
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { isActive: true } });
    const pendingUsers = await prisma.user.count({
      where: { registrationStatus: 'PENDING' }
    });

    // Группировка по ролям (закомментировано так как не используется)
    // const usersByRole = await prisma.user.groupBy({
    //   by: ['roles'],
    //   _count: {
    //     roles: true
    //   }
    // });

    // Подсчет по каждой роли
    const roleStats = {
      ADMIN: 0,
      MANAGER: 0,
      WAREHOUSE: 0,
      OPERATOR: 0,
      TECHNICIAN: 0,
      DRIVER: 0
    };

    // Подсчет пользователей по ролям (учитывая что у пользователя может быть несколько ролей)
    const allUsers = await prisma.user.findMany({ select: { roles: true } });
    allUsers.forEach(user => {
      user.roles.forEach(role => {
        if (Object.prototype.hasOwnProperty.call(roleStats, role)) {
          roleStats[role]++;
        }
      });
    });

    res.json({
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers,
      pending: pendingUsers,
      byRole: roleStats,
      registrationTrend: {
        today: 0, // TODO: Добавить подсчет за сегодня
        week: 0, // TODO: Добавить подсчет за неделю
        month: 0 // TODO: Добавить подсчет за месяц
      }
    });
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать пользователя
router.post('/', async (req, res) => {
  try {
    const user = await prisma.user.create({
      data: req.body
    });
    res.status(201).json(user);
  } catch (error) {
    console.error('Ошибка создания пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
