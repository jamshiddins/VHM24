const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Получить все маршруты
router.get('/', async (req, res) => {
  try {
    const routes = await prisma.route.findMany({
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        stops: {
          include: {
            machine: true
          }
        }
      }
    });
    res.json(routes);
  } catch (error) {
    console.error('Ошибка получения маршрутов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить логи водителей
router.get('/driver-logs', async (req, res) => {
  try {
    const logs = await prisma.driverLog.findMany({
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(logs);
  } catch (error) {
    console.error('Ошибка получения логов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать маршрут
router.post('/', async (req, res) => {
  try {
    const route = await prisma.route.create({
      data: req.body
    });
    res.status(201).json(route);
  } catch (error) {
    console.error('Ошибка создания маршрута:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
