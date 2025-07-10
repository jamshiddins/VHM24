const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Получить статистику для дашборда
router.get('/stats', async (req, res) => {
  try {
    // Получаем количество машин
    const totalMachines = await prisma.machine.count();
    const onlineMachines = await prisma.machine.count({
      where: { status: 'ONLINE' }
    });
    
    // Получаем количество активных задач
    const activeTasks = await prisma.task.count({
      where: { 
        status: {
          in: ['CREATED', 'ASSIGNED', 'IN_PROGRESS']
        }
      }
    });
    
    // Получаем количество пользователей
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: { isActive: true }
    });
    
    // Получаем количество товаров
    const totalItems = await prisma.inventoryItem.count();
    const lowStockItems = await prisma.inventoryItem.count({
      where: {
        AND: [
          { minQuantity: { not: null } },
          { quantity: { lte: prisma.inventoryItem.fields.minQuantity } }
        ]
      }
    });
    
    // Формируем ответ
    const stats = {
      machines: {
        total: totalMachines,
        online: onlineMachines,
        offline: totalMachines - onlineMachines,
        percentage: totalMachines > 0 ? Math.round((onlineMachines / totalMachines) * 100) : 0
      },
      tasks: {
        active: activeTasks,
        today: 0, // TODO: Добавить подсчет задач за сегодня
        completed: 0 // TODO: Добавить подсчет выполненных задач
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers
      },
      inventory: {
        total: totalItems,
        lowStock: lowStockItems,
        alerts: lowStockItems
      },
      revenue: {
        today: 0, // TODO: Добавить подсчет выручки
        month: 0,
        growth: 0
      }
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить последние активности
router.get('/activities', async (req, res) => {
  try {
    const activities = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    res.json(activities);
  } catch (error) {
    console.error('Ошибка получения активностей:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить уведомления
router.get('/notifications', async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { isRead: false },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(notifications);
  } catch (error) {
    console.error('Ошибка получения уведомлений:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
