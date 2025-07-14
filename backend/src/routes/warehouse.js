/**
 * Маршруты для работы со складом
 */
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Middleware для проверки аутентификации
const authenticateToken = (req, res, next) => {
  // В реальном приложении здесь должна быть проверка JWT токена
  // Для тестирования просто пропускаем дальше
  next();
};

/**
 * @route GET /api/warehouse
 * @desc Получение списка складов
 */
router.get('/', async (req, res) => {
  try {
    // В реальном приложении здесь должен быть запрос к базе данных
    // Для тестирования возвращаем моковые данные
    const warehouses = [
      {
        id: '1',
        name: 'Центральный склад',
        address: 'г. Москва, ул. Складская, 1',
        capacity: 1000,
        currentUsage: 750
      },
      {
        id: '2',
        name: 'Региональный склад',
        address: 'г. Санкт-Петербург, ул. Логистическая, 5',
        capacity: 500,
        currentUsage: 320
      }
    ];
    
    res.json({ warehouses });
  } catch (error) {
    console.error('Ошибка получения складов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

/**
 * @route GET /api/warehouse/:id
 * @desc Получение информации о складе по ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // В реальном приложении здесь должен быть запрос к базе данных
    // Для тестирования возвращаем моковые данные
    const warehouse = {
      id,
      name: `Склад #${id}`,
      address: 'г. Москва, ул. Складская, 1',
      capacity: 1000,
      currentUsage: 750,
      items: [
        { id: '1', name: 'Кофе', quantity: 100, unit: 'кг' },
        { id: '2', name: 'Стаканчики', quantity: 5000, unit: 'шт' }
      ]
    };
    
    res.json({ warehouse });
  } catch (error) {
    console.error('Ошибка получения склада:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

/**
 * @route POST /api/warehouse
 * @desc Создание нового склада
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, address, capacity } = req.body;
    
    if (!name || !address) {
      return res.status(400).json({ error: 'Название и адрес склада обязательны' });
    }
    
    // В реальном приложении здесь должен быть запрос к базе данных
    // Для тестирования возвращаем моковые данные
    const warehouse = {
      id: Date.now().toString(),
      name,
      address,
      capacity: capacity || 1000,
      currentUsage: 0,
      createdAt: new Date().toISOString()
    };
    
    res.status(201).json({ warehouse, message: 'Склад успешно создан' });
  } catch (error) {
    console.error('Ошибка создания склада:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
