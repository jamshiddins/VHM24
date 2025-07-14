const express = require('express');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();
const prisma = new PrismaClient();

// Авторизация через Telegram
router.post('/telegram', async (req, res) => {
  try {
    const { telegramId, username, firstName, lastName } = req.body;

    if (!telegramId) {
      return res.status(400).json({ error: 'Telegram ID обязателен' });
    }

    // Поиск или создание пользователя
    let user = await prisma.user.findUnique({
      where: { telegramId: String(telegramId) }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId: String(telegramId),
          username: username || '',
          firstName: firstName || '',
          lastName: lastName || '',
          role: 'operator'
        }
      });
    }

    // Создание JWT токена
    const token = jwt.sign(
      { 
        userId: user.id,
        telegramId: user.telegramId,
        role: user.role 
      },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Ошибка авторизации:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Проверка токена
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Токен не предоставлен' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Ошибка проверки токена:', error);
    res.status(401).json({ error: 'Недействительный токен' });
  }
});

module.exports = router;
