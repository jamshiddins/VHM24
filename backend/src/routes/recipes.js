const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Получить все рецепты
router.get('/', async (req, res) => {
  try {
    const recipes = await prisma.recipe.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(recipes);
  } catch (error) {
    console.error('Ошибка получения рецептов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить рецепт по ID
router.get('/:id', async (req, res) => {
  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: req.params.id }
    });

    if (!recipe) {
      return res.status(404).json({ error: 'Рецепт не найден' });
    }

    res.json(recipe);
  } catch (error) {
    console.error('Ошибка получения рецепта:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать рецепт
router.post('/', async (req, res) => {
  try {
    const { name, description, ...rest } = req.body;

    const recipe = await prisma.recipe.create({
      data: {
        name,
        description,
        ...rest
      }
    });

    res.status(201).json(recipe);
  } catch (error) {
    console.error('Ошибка создания рецепта:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить рецепт
router.put('/:id', async (req, res) => {
  try {
    const recipe = await prisma.recipe.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(recipe);
  } catch (error) {
    console.error('Ошибка обновления рецепта:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить рецепт
router.delete('/:id', async (req, res) => {
  try {
    await prisma.recipe.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
  } catch (error) {
    console.error('Ошибка удаления рецепта:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
