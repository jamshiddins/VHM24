const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole } = require('../middleware/roleCheck');

const router = express.Router();
const prisma = new PrismaClient();

// GET /users - Получить всех пользователей
router.get('/', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true
            }
        });
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Ошибка получения пользователей' });
    }
});

// GET /users/:id - Получить пользователя по ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: {
                id: true,
                name: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true
            }
        });
        
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Ошибка получения пользователя' });
    }
});

// POST /users - Создать пользователя
router.post('/', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { telegramId, name, phone, role } = req.body;
        
        const user = await prisma.user.create({
            data: {
                telegramId,
                name,
                phone,
                role: role || 'OPERATOR'
            }
        });
        
        res.status(201).json(user);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Ошибка создания пользователя' });
    }
});

// PUT /users/:id - Обновить пользователя
router.put('/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    try {
        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(user);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Ошибка обновления пользователя' });
    }
});


/**
 * @route POST /api/users/sync
 * @desc Синхронизация пользователя между Telegram-ботом и веб-интерфейсом
 */
router.post('/sync', async (req, res) => {
  try {
    const { userId, telegramId, firstName, lastName, role } = req.body;
    
    if (!userId || !telegramId) {
      return res.status(400).json({
        success: false,
        error: 'Отсутствуют обязательные параметры'
      });
    }
    
    // Проверяем, существует ли пользователь
    let user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      // Проверяем, существует ли пользователь с таким Telegram ID
      user = await prisma.user.findUnique({
        where: { telegramId }
      });
      
      if (user) {
        // Обновляем существующего пользователя
        user = await prisma.user.update({
          where: { telegramId },
          data: {
            firstName: firstName || user.firstName,
            lastName: lastName || user.lastName,
            role: role || user.role
          }
        });
        
        return res.json({
          success: true,
          message: 'Пользователь успешно обновлен',
          user
        });
      }
      
      // Создаем нового пользователя
      user = await prisma.user.create({
        data: {
          id: userId,
          telegramId,
          firstName: firstName || '',
          lastName: lastName || '',
          role: role || 'USER',
          status: 'ACTIVE'
        }
      });
      
      return res.json({
        success: true,
        message: 'Пользователь успешно создан',
        user
      });
    }
    
    // Обновляем существующего пользователя
    user = await prisma.user.update({
      where: { id: userId },
      data: {
        telegramId,
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
        role: role || user.role
      }
    });
    
    res.json({
      success: true,
      message: 'Пользователь успешно синхронизирован',
      user
    });
  } catch (error) {
    console.error('Ошибка синхронизации пользователя:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка синхронизации пользователя',
      details: error.message
    });
  }
});

module.exports = router;
