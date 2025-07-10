const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
// const prisma = new PrismaClient(); // Закомментировано так как не используется

// Получить задания импорта
router.get('/jobs', async (req, res) => {
  try {
    // Возвращаем пустой массив, так как функционал импорта еще не реализован
    res.json([]);
  } catch (error) {
    console.error('Ошибка получения заданий импорта:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить исторические данные импорта
router.get('/historical', async (req, res) => {
  try {
    // Возвращаем пустой массив, так как функционал импорта еще не реализован
    res.json([]);
  } catch (error) {
    console.error('Ошибка получения исторических данных:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать новое задание импорта
router.post('/jobs', async (req, res) => {
  try {
    // Заглушка для будущей реализации
    res.status(201).json({
      id: Date.now().toString(),
      status: 'pending',
      message: 'Функционал импорта данных будет реализован позже'
    });
  } catch (error) {
    console.error('Ошибка создания задания импорта:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
