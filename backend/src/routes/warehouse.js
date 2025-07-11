const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Корневой маршрут склада
router.get('/', async (req, res) => {
  try {
    res.json({
      message: 'VHM24 Warehouse API',
      endpoints: [
        'GET /items - Товары на складе',
        'GET /operations - Операции склада',
        'GET /bunkers - Бункеры',
        'POST /operations - Создать операцию'
      ]
    });
  } catch (error) {
    console.error('Ошибка склада:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить все товары на складе
router.get('/items', async (req, res) => {
  try {
    const items = await prisma.inventoryItem.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(items);
  } catch (error) {
    console.error('Ошибка получения товаров:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить операции склада
router.get('/operations', async (req, res) => {
  try {
    const operations = await prisma.stockMovement.findMany({
      include: {
        item: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        machine: true
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json(operations);
  } catch (error) {
    console.error('Ошибка получения операций:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить бункеры (пустая заглушка, так как bunkers нет в схеме)
router.get('/bunkers', async (req, res) => {
  res.json([]);
});

// Создать операцию движения товара
router.post('/operations', async (req, res) => {
  try {
    const operation = await prisma.stockMovement.create({
      data: req.body
    });
    res.status(201).json(operation);
  } catch (error) {
    console.error('Ошибка создания операции:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
