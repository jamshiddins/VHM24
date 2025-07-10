const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Регистрация
router.post('/register', async (req, res) => {
  try {
    const { telegramId, username, password, role } = req.body;
    
    // Проверка существующего пользователя
    const existingUser = await prisma.user.findUnique({
      where: { telegramId }
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь уже существует' });
    }
    
    // Хеширование пароля
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    
    // Создание пользователя
    const user = await prisma.user.create({
      data: {
        telegramId,
        username,
        passwordHash: hashedPassword,
        role: role || 'operator',
        isActive: false // Требует подтверждения админом
      }
    });
    
    res.status(201).json({
      message: 'Регистрация успешна. Ожидайте подтверждения администратора.',
      userId: user.id
    });
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Вход
router.post('/login', async (req, res) => {
  try {
    const { telegramId, password } = req.body;
    
    // Поиск пользователя
    const user = await prisma.user.findUnique({
      where: { telegramId }
    });
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }
    
    // Проверка пароля
    if (user.passwordHash) {
      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Неверные учетные данные' });
      }
    }
    
    // Создание токена
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Ошибка входа:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить пользователей по роли
router.get('/users', async (req, res) => {
  try {
    const { role } = req.query;
    
    const users = await prisma.user.findMany({
      where: role ? {
        roles: {
          has: role
        }
      } : undefined,
      select: {
        id: true,
        name: true,
        email: true,
        roles: true,
        phoneNumber: true,
        isActive: true,
        isDriver: true,
        createdAt: true
      }
    });
    
    res.json(users);
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
