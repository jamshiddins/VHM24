const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Получить все ингредиенты
router.get('/', async (req, res) => {
  try {
    const ingredients = await prisma.inventoryItem.findMany({
      where: { category: 'ingredient' },
      orderBy: { name: 'asc' }
    });
    res.json(ingredients);
  } catch (error) {
    console.error('Ошибка получения ингредиентов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить ингредиент по ID
router.get('/:id', async (req, res) => {
  try {
    const ingredient = await prisma.inventoryItem.findUnique({
      where: { id: req.params.id }
    });
    
    if (!ingredient) {
      return res.status(404).json({ error: 'Ингредиент не найден' });
    }
    
    res.json(ingredient);
  } catch (error) {
    console.error('Ошибка получения ингредиента:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать ингредиент
router.post('/', async (req, res) => {
  try {
    const ingredient = await prisma.inventoryItem.create({
      data: {
        ...req.body,
        category: 'ingredient'
      }
    });
    res.status(201).json(ingredient);
  } catch (error) {
    console.error('Ошибка создания ингредиента:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
